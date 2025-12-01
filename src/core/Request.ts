// src/Request.ts
import { IncomingMessage, ServerResponse } from "http";
import { AsyncLocalStorage } from "node:async_hooks";

class Request {
  private static storage = new AsyncLocalStorage<Request>();
  public req: IncomingMessage;
  public res: ServerResponse;

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.req = req;
    this.res = res;
  }

  static run(req: IncomingMessage, res: ServerResponse, callback: () => void) {
    const requestInstance = new Request(req, res);
    this.storage.run(requestInstance, callback);
  }

  static current(): Request {
    const store = this.storage.getStore();
    if (!store) throw new Error("No current request available");
    return store;
  }

  get ip(): string {
    let ip =
      this.req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      this.req.socket.remoteAddress ||
      (this.req as any).connection?.remoteAddress ||
      "";

    // Normalize IPv6 mapped IPv4 (e.g., ::ffff:127.0.0.1)
    if (ip.startsWith("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }
    return ip;
  }

  get query(): URLSearchParams {
    const url = new URL(this.req.url!, `http://${this.req.headers.host}`);
    return url.searchParams;
  }

  get params(): Record<string, string> {
    return (this.req as any).params || {};
  }

  get body(): any {
    return (this.req as any).body;
  }
  get fullUrl(): string {
    const protocol = this.req.headers["x-forwarded-proto"] || "http";
    const host = this.req.headers.host;
    return `${protocol}://${host}${this.req.url}`;
  }
}

export { Request };
