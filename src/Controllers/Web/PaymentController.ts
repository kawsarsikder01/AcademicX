import { Controller } from "../Controller";
import { Request } from "../../Middleware/JsonParser";
import { Payment } from "../../Models/Payment";
import z, { number } from "zod";
import { Course } from "../../Models/Course";
import { generateTrxId } from "../../Helper/Helpers";

const paymentSchema = z.object({
  course_ids: z.array(z.number().min(1)).min(1),
});

export class PaymentController extends Controller {
  private payment: Payment = new Payment();
  private course: Course = new Course();

  async createPayment(request: Request, response: Response) {
    const validate = paymentSchema.safeParse(request.body);

    if (!validate.success) {
      return this.json(response, { error: validate.error });
    }

    const courses =await this.course.whereIn("id", validate.data?.course_ids).get();

    const amount = courses.reduce((total, course) => total + this.calculateDiscountedPrice(course.price,course.discount), 0);
    const course_ids = courses.map((course)=>course.id);

    const paymentData = {
      course_ids: JSON.stringify(course_ids),
      amount: amount,
      status: 0,
      trx_id: generateTrxId()
    };
  }


  calculateDiscountedPrice(price: number, discount: number): number {
    if (discount <= 0 || discount >= 100) {
      return price; // No discount applied
    }
    const discountedPrice = price - (price * discount) / 100;
    return Math.round(discountedPrice * 100) / 100; // Round to 2 decimal places
  }

  async verifyPayment(request: Request, response: Response) {}
}
