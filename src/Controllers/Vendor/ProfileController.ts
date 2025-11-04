import { AuthenticatedRequest } from "../../Middleware/VendorAuth";
import { Controller } from "../Controller";

export class ProfileController extends Controller {
  constructor() {
    super();
  }

  index(request: AuthenticatedRequest, response: Response) {
    const { password, ...vendorWithoutPassword } = request.user; // exclude password
    return this.json(response, vendorWithoutPassword);
  }
}
