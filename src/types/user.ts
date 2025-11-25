import { IncomingMessage } from "http";

export interface AuthenticatedRequest extends IncomingMessage {
    user?: any; // decoded JWT user data
    body?: any;
  }