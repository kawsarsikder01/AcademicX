import { IncomingMessage, ServerResponse } from "http";
import jwt from "jsonwebtoken";
import { Admin } from "../Models/Admin";

// Store this in an .env file
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export interface AuthenticatedRequest extends IncomingMessage {
  user?: any; // decoded JWT user data
}

export const auth = async (
  req: AuthenticatedRequest,
  res: ServerResponse,
  next: () => void
) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.statusCode = 401;
    res.end(JSON.stringify({ message: "Unauthorized: No token provided" }));
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Check if admin exists
    const adminModel = new Admin();
    const admin = await adminModel.firstWhere({ email: decoded.email });
    if (!admin) {
      res.statusCode = 401;
      res.end(JSON.stringify({ message: "Unauthorized: User not found" }));
      return;
    }

    req.user = admin; // attach full admin data, not just JWT payload
    next();
  } catch (error) {
    res.statusCode = 401;
    res.end(JSON.stringify({ message: "Unauthorized: Invalid token" }));
  }
};
