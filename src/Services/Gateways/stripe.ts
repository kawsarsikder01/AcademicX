import Stripe from "stripe";
import { route } from "../../Helper/Helpers";
import { Payment as PaymentModal } from "../../Models/Payment";
import { IncomingMessage } from "http";

export class Payment {
  public static async prepareData(payment: any, gateway: any) {
    let amount = Math.round(payment.amount * 100);
    const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
      apiVersion: "2025-11-17.clover",
    });


 
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "AcademicX",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:5000/api/ipn?stripe&trx=${payment.trx_id}&payment_intent={CHECKOUT_SESSION_ID}`,
      cancel_url: "http://localhost:3000/failed",
    });



    return {
      redirect: true,
      redirect_url: session.url,
    };
  }

  public static async ipn(req: IncomingMessage, gateway: any, payment: any = null) {
    const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
      apiVersion: "2025-11-17.clover",
    });

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const paymentIntentId = url.searchParams.get("payment_intent");
 

    if (!paymentIntentId) {
      return {
        status: "error",
        msg: "Payment Intent missing",
        redirect: route("/failed"),
      };
    }

    // Retrieve the checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      paymentIntentId
    );

    // Retrieve the actual payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(
      checkoutSession.payment_intent as string
    );

   
    if (paymentIntent.status === "succeeded") {
       
      const paymentModel = new PaymentModal();

      paymentModel.update(payment.id,{status: 1});
     
      return true;
    } else {
      return false;
    }
  }
}
