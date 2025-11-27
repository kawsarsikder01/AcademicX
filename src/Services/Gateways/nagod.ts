import { getIp, route } from "../../Helper/Helpers";
import { Nagod } from "../../Helper/nagod";
import axios from "axios";

export class Payment extends Nagod {
  public static async prepareData(payment: any, gateway: any,ip: string) {
    const _this = new this();
    if (!gateway.merchant_id) {
      throw new Error("Unable to process with nagad.");
    }

    const refNo = payment.trx_id;
    let additionalInfo: any = null;

    const sensitiveData = _this.generateSensitiveData(
      gateway.merchant_id,
      refNo
    );

    const initResponse = await axios.post(
      `${_this.getBaseUrl()}/check-out/initialize/${
        gateway.merchant_id
      }/${refNo}`,
      {
        accountNumber: gateway.merchant_id,
        dateTime: new Date().toISOString().replace(/[-:TZ.]/g, ""), // format like 'YmdHis'
        sensitiveData: _this.encryptDataWithPublicKey(
          gateway,
          JSON.stringify(sensitiveData)
        ),
        signature: _this.signatureGenerate(
          gateway,
          JSON.stringify(sensitiveData)
        ),
      },
      { headers: _this.headers(ip) }
    );

    if (initResponse.status !== 200) {
      throw new Error("Something went wrong while trying to pay with nagad.");
    }

    const nagadData = initResponse.data;

    if (nagadData.reason) {
      throw new Error("Something went wrong while trying to pay with nagad.");
    }

    if (!_this.decryptInitialResponse(gateway, nagadData)) {
      throw new Error("Something went wrong while trying to pay with nagad.");
    }

    // Prepare order data
    const sensitiveOrderData = _this.generateSensitiveDataOrder(
      gateway.merchant_id,
      refNo,
      payment.amount,
      0
    );

    const completeResponse = await axios.post(
      `${_this.getBaseUrl()}/check-out/complete/${_this.PAYMENT_REF_ID}`,
      {
        sensitiveData: _this.encryptDataWithPublicKey(
          gateway,
          JSON.stringify(sensitiveOrderData)
        ),
        signature: _this.signatureGenerate(
          gateway,
          JSON.stringify(sensitiveOrderData)
        ),
        merchantCallbackURL: route(`ipn?nagad&trx=${payment.trx_id}`),
        additionalMerchantInfo: additionalInfo ?? {},
      },
      { headers: _this.headers(ip) }
    );

    if (completeResponse.status !== 200) {
      throw new Error(
        "Something went wrong while trying to initiate payment with nagad."
      );
    }

    const nagadCompleteData: any = completeResponse.data;

    if (nagadCompleteData.reason) {
      throw new Error(
        "Something went wrong while trying to initiate payment with nagad."
      );
    }

    nagadCompleteData.paymentID = _this.PAYMENT_REF_ID;

    return {
      redirect: true,
      redirect_url: nagadCompleteData.callBackUrl,
      paymentId: nagadCompleteData.paymentID,
    };
  }

  public static async ipn(request: any, gateway: any, payment: any) {
    const _this = new this();

    const failureStatuses: Record<string, string> = {
      Failed: "Payment Failed",
      Cancelled: "Payment Cancelled",
      InvalidRequest: "Invalid Request",
      Fraud: "fraudulent activity",
      Aborted: "Aborted",
      UnknownFailed: "Unknown Failed",
    };

    if (request.status && failureStatuses[request.status]) {
      return _this.updateAndMessage(
        failureStatuses[request.status],
        request.status,
        request.message
      );
    }

    const merchantId = gateway.merchant_id;

    if (
        request.status === "Success" &&
        request.payment_ref_id &&
        request.merchant === merchantId
    ) {
        const verifyPaymentResponse: any = await _this.verifyPayment(
            gateway,
            request.payment_ref_id,
            getIp(request)
        );

        if (
            verifyPaymentResponse.status === "Success" &&
            verifyPaymentResponse.merchantId === merchantId
        ) {
            

            return {
                status: request.status.toLowerCase(),
                msg: verifyPaymentResponse.message,
                redirect: "success" // replace with proper route
            };
        } else {
            return _this.updateAndMessage(
                "Unknown Failed",
                "Failed",
                verifyPaymentResponse.message
            );
        }
    }
  }


  // Verify payment
  public async verifyPayment(gateway: any, paymentId: string,ip: string) {
    if (!this.getBaseUrl() || !gateway?.merchant_id) {
        throw new Error("Unable to process with nagad.");
    }

    const response = await axios.get(
        `${this.getBaseUrl()}/verify/payment/${paymentId}`,
        { headers: this.headers(ip) }
    );

    if (response.status === 200) {
        return response.data;
    }

    throw new Error(
        "Something went wrong while trying to verify your payment with nagad."
    );
}

// Refund
public static async refund(
    deposit: any,
    refNo: string,
    gateway: any,
    amount: number,
    ip: string
) {
    const _this = new this();

    if (!_this.getBaseUrl() || !gateway?.merchant_id) {
        throw new Error("Unable to process with nagad.");
    }

    const sensitiveOrderData = {
        merchantId: gateway.merchant_id,
        originalRequestDate: new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, ""), // 'Ymd' format
        originalAmount: deposit.payable_amount,
        cancelAmount: amount,
        referenceNo: refNo,
        referenceMessage: "Requested for refund."
    };

    const response = await axios.post(
        `${_this.getBaseUrl()}/purchase/cancel?paymentRefId=${deposit.payment_id}&orderId=${refNo}`,
        {
            sensitiveDataCancelRequest: _this.encryptDataWithPublicKey(
                gateway,
                JSON.stringify(sensitiveOrderData)
            ),
            signature: _this.signatureGenerate(
                gateway,
                JSON.stringify(sensitiveOrderData)
            )
        },
        { headers: _this.headers(ip) }
    );

    if (response.status === 200) {
        const nagadResponse: any = response.data;
        return JSON.parse(
            _this.decryptDataWithPrivateKey(gateway, nagadResponse.sensitiveData)
        );
    }

    throw new Error(
        "Something went wrong while trying to verify your payment with nagad."
    );
}
}
