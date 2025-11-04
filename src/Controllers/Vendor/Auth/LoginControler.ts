import { Controller } from "../../Controller";
import { Request } from "../../../Middleware/JsonParser";
import { ServerResponse } from "http";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import { Vendor } from "../../../Models/Vendor";

interface LoginDto {
  email: string;
  password: string;
}

// Ensure JWT_SECRET exists
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not defined");

export class LoginController extends Controller {
  async login(req: Request<LoginDto>, res: ServerResponse) {
    const { email, password } = req.body;

    if (!email || !password) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Email and password are required" }));
      return;
    }

    const vendorModel = new Vendor();
    const vendor = await vendorModel.firstWhere({ email });
    if (!vendor) {
      res.statusCode = 401;
      res.end(JSON.stringify({ message: "Invalid credentials" }));
      return;
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ message: "Invalid credentials" }));
    }

    // Inline expiresIn and cast the whole options object
    const token = jwt.sign(
      { id: vendor.id, email: vendor.email },
      JWT_SECRET as Secret,
      { expiresIn: process.env.EXPIRES_IN ?? "30d" } as jwt.SignOptions
    );

    return this.json(res, { token });
  }
}
