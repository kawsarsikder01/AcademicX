import { IncomingMessage, ServerResponse } from "http";

// Export the generic Request interface
export interface Request<T = any> extends IncomingMessage {
  body: T;
}

export type Middleware = (req: Request, res: ServerResponse, next: () => void) => void;

// JSON body parser middleware
export const jsonParser: Middleware = (req: Request, res, next) => {
  let body = "";
  req.on("data", (chunk: Buffer) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch {
      req.body = {};
    }
    next();
  });
};
