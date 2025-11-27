import { Request } from "../core/Request";
import { DateTime } from "luxon";
import crypto from "crypto";
import forge from "node-forge";

export class Nagod {
  protected CHALLANGE: any;
  protected PAYMENT_REF_ID: any;

  protected getBaseUrl() {
    return process.env.NAGOD_BASE_URL;
  }

  protected headers(ip: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-KM-IP-V4": ip,
      "X-KM-Api-Version": "v-0.2.0",
      "X-KM-Client-Type": "PC_WEB",
    };
  }

  protected generateRandomString(length: number = 40): string {
    const characters =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomString = "";
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      randomString += characters[randomIndex];
    }

    return randomString;
  }

  protected generateSensitiveData(merchantId: string, trx_id: string) {
    return {
      merchantId: merchantId,
      datetime: DateTime.now().setZone("Asia/Dhaka").toFormat("yyyyMMddHHmmss"),
      orderId: trx_id,
      challenge: this.generateRandomString(),
    };
  }

  protected generateSensitiveDataOrder(
    merchantId: string,
    orderId: string,
    amount: number,
    charge: number
  ): Record<string, any> {
    return {
      merchantId: merchantId,
      orderId: orderId,
      currencyCode: "050", // 050 = BDT
      amount: amount,
      charge: charge,
      challenge: this.CHALLANGE,
    };
  }

  public signatureGenerate(gateway: any, data: string): string {
    const privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${gateway.private_key}\n-----END RSA PRIVATE KEY-----`;

    const sign = crypto.createSign("RSA-SHA256");
    sign.update(data);
    sign.end();

    const signature = sign.sign(privateKey);
    return signature.toString("base64");
  }

  public decryptDataWithPrivateKey(gateway: any, crypttext: string): string {
    const privateKeyPem = `-----BEGIN RSA PRIVATE KEY-----\n${gateway.private_key}\n-----END RSA PRIVATE KEY-----`;

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    const decoded = Buffer.from(crypttext, "base64").toString("binary");

    const decrypted = privateKey.decrypt(decoded, "RSAES-PKCS1-V1_5");

    return decrypted;
  }
  // Decrypt initial response
  protected decryptInitialResponse(gateway: any, response: any): boolean {
    const plainResponse = JSON.parse(
      this.decryptDataWithPrivateKey(gateway, response.sensitiveData)
    );

    if (plainResponse.paymentReferenceId && plainResponse.challenge) {
      this.PAYMENT_REF_ID = plainResponse.paymentReferenceId;
      this.CHALLANGE = plainResponse.challenge;
      return true;
    }
    return false;
  }

  public encryptDataWithPublicKey(gateway: any, data: string): string {
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${gateway.public_key}\n-----END PUBLIC KEY-----`;

    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    const encrypted = publicKey.encrypt(data, "RSAES-PKCS1-V1_5");

    return Buffer.from(encrypted, "binary").toString("base64");
  }

  public updateAndMessage(note: string, status: string, msg: string) {
    const data = {
      status: status.toLowerCase(),
      msg: msg,
      redirect: "failed",
      note: note,
    };

    return data;
  }
}
