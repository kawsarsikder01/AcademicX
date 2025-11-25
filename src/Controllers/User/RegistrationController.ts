import { User } from "../../Models/User";
import { Controller } from "../Controller";
import z from "zod";
import bcrypt from "bcrypt";
import { saveFile } from "../../Helper/Uploader";
import jwt, { Secret } from "jsonwebtoken";


const fileSchema = z.object({
    originalname: z.string(),
    path: z.string(),
  }).optional();


const RegisterSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email().nullable(),
  image: fileSchema.optional(),
  status: z.string().optional().default('active'),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

interface UserData {
    name: string;
    email: string | null;
    status: string;
    password: string;
    image?: string; 
    driver?: string;
  }

  const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not defined");

export class RegistrationController extends Controller {
  private userModel: User;

  constructor() {
    super();
    this.userModel = new User();
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

    const files = (request as any).files || {};

    const data: UserData = {
        name: validate.data.name,
        email: validate.data.email,
        status: validate.data.status,
        password: validate.data.password
    }


     if (files.image?.[0]) {
        const saveImage = await saveFile(files.image[0]);
        data.image = saveImage.path;
        data.driver = saveImage.driver;
     }

     

    // Check if either email OR phone exists
    const existingVendor = await this.userModel.findOne({
      email: data.email
    });

    if (existingVendor) {
      return this.json(response, "Email or phone already exists", 400);
    }

    // Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;

    const userId =  await this.userModel.create(data);

    // Inline expiresIn and cast the whole options object
    const token = jwt.sign(
        { id: userId, email: data.email },
        JWT_SECRET as Secret,
        { expiresIn: process.env.EXPIRES_IN ?? "30d" } as jwt.SignOptions
      );

    return this.json(
      response,
      {
        token: token,
        message: "Registration successful."
      }
    );
  }
}
