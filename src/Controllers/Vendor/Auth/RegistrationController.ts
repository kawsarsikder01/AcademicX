import { Vendor } from "../../../Models/Vendor";
import { Controller } from "../../Controller";
import z from "zod";
import bcrypt from "bcrypt";

const RegisterSchema = z.object({
  ownername: z.string().min(1, "Vendor name is required"),
  email: z.string().email().nullable(),
  company_name: z.string().min(1, "Company or Institute name is required"),
  bio: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().min(1, "Address is required"),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export class RegistrationController extends Controller {
  private vendorModel: Vendor;

  constructor() {
    super();
    this.vendorModel = new Vendor();
  }

  async register(request: Request, response: Response) {
    const validate = RegisterSchema.safeParse(request.body);

    if (!validate.success) {
      const errors = validate.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return this.json(response, { errors: errors }, 400);
    }

    const data = validate.data;

    // Check if either email OR phone exists
    const existingVendor = await this.vendorModel.findOne({
      email: data.email,
      phone: data.phone,
    });

    if (existingVendor) {
      return this.json(response, "Email or phone already exists", 400);
    }

    // Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;

    await this.vendorModel.create(data);

    return this.json(
      response,
      "Registration successful. Your account is pending approval."
    );
  }
}
