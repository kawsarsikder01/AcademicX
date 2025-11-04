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
}
