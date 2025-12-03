import { Controller } from "../Controller";
import { Request } from "../../Middleware/JsonParser";
import { Payment } from "../../Models/Payment";
import z from "zod";
import { Course } from "../../Models/Course";
import { generateTrxId, getIp } from "../../Helper/Helpers";
import { Payment as StripePayment } from "../../Services/Gateways/stripe"; 
import { AuthenticatedRequest } from "../../types/user";
import { StudentCourse } from "../../Models/StudentCourse"; 
import { Vendor } from "../../Models/Vendor";
import { Setting } from "../../Models/Setting";

const paymentSchema = z.object({
  course_ids: z.array(z.string().min(1)).min(1),
});

const Gateway = {
  id: 1,
  name: "stripe",
  merchant_id: "",
  private_key: "",
  public_key: "",
  merchant_phone: "",
};

export class PaymentController extends Controller {
  private payment: Payment = new Payment();
  private course: Course = new Course();
  private studentCourse: StudentCourse = new StudentCourse();
  private vendor: Vendor = new Vendor();
  private setting: Setting = new Setting();

  async createPayment(request: AuthenticatedRequest, response: Response) {
    const validate = paymentSchema.safeParse(request.body);
    const user = request.user;
 


    if (!validate.success) {
      return this.json(response, { error: validate.error });
    }

    const courses = await this.course
      .whereIn("id", validate.data?.course_ids)
      .get();

    const amount = courses.reduce(
      (total, course) =>
        total + this.calculateDiscountedPrice(course.price, course.discount),
      0
    );
    const course_ids = courses.map((course) => course.id);

    const paymentData = {
      course_ids: JSON.stringify(course_ids),
      amount: amount,
      status: 0,
      trx_id: generateTrxId(),
      user_id: user.id,
    };

     const payment = await this.payment.create(paymentData); 
     try{
      const data = await StripePayment.prepareData(payment,Gateway);
      return this.json(response,data);
     }catch(err){
      console.log(err);
     }
     return this.json(response,{
      message: "Something went wrong try again"
     },400)
  }

  calculateDiscountedPrice(price: number, discount: number): number {
    if (discount <= 0 || discount >= 100) {
      return price; // No discount applied
    }
    const discountedPrice = price - (price * discount) / 100;
    return Math.round(discountedPrice * 100) / 100; // Round to 2 decimal places
  }

  async verifyPayment(
    request: any,
    response: Response
  ) {
    try {
 
      const body = request.query;
      let trx = body.trx;

       

      const gateway = Gateway;

      if (trx) {
        const payment = await this.payment.with('user').where({ trx_id: trx }).first();

        if (!payment) {
          throw new Error("Invallid Payment Request");
        }

        const data = await StripePayment.ipn(request, gateway, payment);

 
        if(data === false){
          return this.redirect(response,`${process.env.FAILED_URL}`);
        }

        const user = payment.user;
        let course_ids: (string | number)[] = [];
        try {
            course_ids = JSON.parse(payment.course_ids) as (string | number)[];
        } catch (err) {
            throw new Error("Failed to parse course_ids");
        }
        
        // Map to student_courses array
        const student_courses = course_ids.map(id => ({
            course_id: id,
            student_id: user.id
        }));

        const courses = await this.course.with('vendor').whereIn("id", course_ids).get();
        const settings = await this.settings();
        courses.forEach((course)=>{
          const amount = this.calculateDiscountedPrice(course.price, course.discount);
          const commission = (amount * settings.site_charge) / 100;
           this.vendor.update(course.vendor_id,{balance: (amount - commission)});
           this.course.update(course.id,{total_students: course.total_students + 1});
        })
         

        await this.studentCourse.createMultiple(student_courses);

        await this.payment.update(payment.id, { status: 1 });
        return this.redirect(response,`${process.env.SUCCESS_URL}`);
      }
      throw new Error("Invallid Payment Request");
    } catch (error) {
      console.log(error);
      return;
    }
  }

  public async settings() {
    return await this.setting.firstOrNew(); 
  }
}
