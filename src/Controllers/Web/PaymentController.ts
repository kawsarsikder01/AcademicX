import { Controller } from "../Controller";
import { Request } from "../../Middleware/JsonParser";
import { Payment } from "../../Models/Payment";
import z, { number } from "zod";
import { Course } from "../../Models/Course";
import { generateTrxId, getIp } from "../../Helper/Helpers";
import { Payment as StripePayment } from "../../Services/Gateways/stripe";
import { notifyPayment } from "../../Helper/socket";
import { AuthenticatedRequest } from "../../types/user";
import { StudentCourse } from "../../Models/StudentCourse";
import { Request as CoreRequest } from "../../core/Request";

const paymentSchema = z.object({
  course_ids: z.array(z.string().min(1)).min(1),
});

const Gateway = {
  id: 1,
  name: "nagod",
  merchant_id: "683002007104225",
  private_key:
    "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCJakyLqojWTDAVUdNJLvuXhROV+LXymqnukBrmiWwTYnJYm9r5cKHj1hYQRhU5eiy6NmFVJqJtwpxyyDSCWSoSmIQMoO2KjYyB5cDajRF45v1GmSeyiIn0hl55qM8ohJGjXQVPfXiqEB5c5REJ8Toy83gzGE3ApmLipoegnwMkewsTNDbe5xZdxN1qfKiRiCL720FtQfIwPDp9ZqbG2OQbdyZUB8I08irKJ0x/psM4SjXasglHBK5G1DX7BmwcB/PRbC0cHYy3pXDmLI8pZl1NehLzbav0Y4fP4MdnpQnfzZJdpaGVE0oI15lq+KZ0tbllNcS+/4MSwW+afvOw9bazAgMBAAECggEAIkenUsw3GKam9BqWh9I1p0Xmbeo+kYftznqai1pK4McVWW9//+wOJsU4edTR5KXK1KVOQKzDpnf/CU9SchYGPd9YScI3n/HR1HHZW2wHqM6O7na0hYA0UhDXLqhjDWuM3WEOOxdE67/bozbtujo4V4+PM8fjVaTsVDhQ60vfv9CnJJ7dLnhqcoovidOwZTHwG+pQtAwbX0ICgKSrc0elv8ZtfwlEvgIrtSiLAO1/CAf+uReUXyBCZhS4Xl7LroKZGiZ80/JE5mc67V/yImVKHBe0aZwgDHgtHh63/50/cAyuUfKyreAH0VLEwy54UCGramPQqYlIReMEbi6U4GC5AQKBgQDfDnHCH1rBvBWfkxPivl/yNKmENBkVikGWBwHNA3wVQ+xZ1Oqmjw3zuHY0xOH0GtK8l3Jy5dRL4DYlwB1qgd/Cxh0mmOv7/C3SviRk7W6FKqdpJLyaE/bqI9AmRCZBpX2PMje6Mm8QHp6+1QpPnN/SenOvoQg/WWYM1DNXUJsfMwKBgQCdtddE7A5IBvgZX2o9vTLZY/3KVuHgJm9dQNbfvtXw+IQfwssPqjrvoU6hPBWHbCZl6FCl2tRh/QfYR/N7H2PvRFfbbeWHw9+xwFP1pdgMug4cTAt4rkRJRLjEnZCNvSMVHrri+fAgpv296nOhwmY/qw5Smi9rMkRY6BoNCiEKgQKBgAaRnFQFLF0MNu7OHAXPaW/ukRdtmVeDDM9oQWtSMPNHXsx+crKY/+YvhnujWKwhphcbtqkfj5L0dWPDNpqOXJKV1wHt+vUexhKwus2mGF0flnKIPG2lLN5UU6rs0tuYDgyLhAyds5ub6zzfdUBG9Gh0ZrfDXETRUyoJjcGChC71AoGAfmSciL0SWQFU1qjUcXRvCzCK1h25WrYS7E6pppm/xia1ZOrtaLmKEEBbzvZjXqv7PhLoh3OQYJO0NM69QMCQi9JfAxnZKWx+m2tDHozyUIjQBDehve8UBRBRcCnDDwU015lQN9YNb23Fz+3VDB/LaF1D1kmBlUys3//r2OV0Q4ECgYBnpo6ZFmrHvV9IMIGjP7XIlVa1uiMCt41FVyINB9SJnamGGauW/pyENvEVh+ueuthSg37e/l0Xu0nm/XGqyKCqkAfBbL2Uj/j5FyDFrpF27PkANDo99CdqL5A4NQzZ69QRlCQ4wnNCq6GsYy2WEJyU2D+K8EBSQcwLsrI7QL7fvQ==",
  public_key:
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjBH1pFNSSRKPuMcNxmU5jZ1x8K9LPFM4XSu11m7uCfLUSE4SEjL30w3ockFvwAcuJffCUwtSpbjr34cSTD7EFG1Jqk9Gg0fQCKvPaU54jjMJoP2toR9fGmQV7y9fz31UVxSk97AqWZZLJBT2lmv76AgpVV0k0xtb/0VIv8pd/j6TIz9SFfsTQOugHkhyRzzhvZisiKzOAAWNX8RMpG+iqQi4p9W9VrmmiCfFDmLFnMrwhncnMsvlXB8QSJCq2irrx3HG0SJJCbS5+atz+E1iqO8QaPJ05snxv82Mf4NlZ4gZK0Pq/VvJ20lSkR+0nk+s/v3BgIyle78wjZP1vWLU4wIDAQAB",
  merchant_phone: "01670229009",
};

export class PaymentController extends Controller {
  private payment: Payment = new Payment();
  private course: Course = new Course();
  private studentCourse: StudentCourse = new StudentCourse();

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
}
