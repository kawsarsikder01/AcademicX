import { Vendor } from "../../../../Models/Vendor";
import { Controller } from "../../../Controller";
import { Request } from "../../../../Middleware/JsonParser";

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

  async updateStatus(
    request: Request<{ status: string }>,
    response: Response,
    id: number | string
  ) {
    const vendor = await this.vendorModel.findOne({ id: { id } });
    if (!vendor) return this.json(response, "Vendor Not Found", 404);

    const { status } = request.body;

    // validate allowed statuses
    const allowed = [ "approved", "rejected","blocked"];
    if (!allowed.includes(status)) {
      return this.json(response, "Invalid status value", 400);
    }

    await this.vendorModel.update(id, { verification_status: status });

    return this.json(response, `Vendor ${status} successfully`);
  }
}
