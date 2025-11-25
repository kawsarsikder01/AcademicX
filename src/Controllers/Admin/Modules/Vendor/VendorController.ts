import { Vendor } from "../../../../Models/Vendor";
import { Controller } from "../../../Controller";

export class VendorController extends Controller {
  private vendorModel: Vendor;
  constructor() {
    super();

    this.vendorModel = new Vendor();
  }

  async index(request: Request, response: Response) {
    const allvendors = await this.vendorModel.paginate(20);

    return this.json(response, allvendors);
  }

  async verify(request: Request, response: Response, id: number | string) {
    const vendor = await this.vendorModel.findOne({ id: id });

    if (!vendor) return this.json(response, "Vendor Not Found");

    await this.vendorModel.update(id, { verification_status: "approved" });
    return this.json(response, "Vendor verify successfully");
  }

  async rejected(request: Request, response: Response, id: number | string) {
    const vendor = await this.vendorModel.findOne({ id: id });
    if (!vendor) return this.json(response, "Vendor Not Found");

    await this.vendorModel.update(id, { verification_status: "rejected" });
    return this.json(response, "Vendor rejected successfully");
  }
}
