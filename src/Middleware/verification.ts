import { IncomingMessage, ServerResponse } from "http";
import { AuthenticatedRequest } from "./VendorAuth";

// Export the generic Request interface
export interface Request<T = any> extends IncomingMessage {
  body: T;
}

type Middleware = (req: Request, res: ServerResponse, next: () => void) => void;

export const verfication: Middleware = (
  req: AuthenticatedRequest,
  res,
  next
) => {

    const vendor = req.user;

    if(vendor && vendor.verification_status !== 'approved'){
        res.statusCode = 403;
        return res.end(JSON.stringify({message: "You are not verified user"}))
    }
    next();
};
