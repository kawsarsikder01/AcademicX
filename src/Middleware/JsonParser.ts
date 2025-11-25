// src/Middleware/dynamicParser.ts
import { IncomingMessage, ServerResponse } from "http";
import formidable, { File } from "formidable";

export interface Request<T = any> extends IncomingMessage {
  body: T; // always defined
  files?: { [key: string]: File[] };
}

export type Middleware = (req: Request, res: ServerResponse, next: () => void) => void;

// Types for Formidable fields and files
type Fields = Record<string, string | string[] | undefined>;
type Files = Record<string, File | File[] | undefined>;

export const dynamicParser: Middleware = (req: Request, res: ServerResponse, next) => {
  const contentType = req.headers["content-type"] || "";

  // ----------------------
  // 1️⃣ JSON Request
  // ----------------------
  if (contentType.includes("application/json")) {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      next();
    });
    return;
  }

  // ----------------------
  // 2️⃣ Multipart Request
  // ----------------------
  if (contentType.includes("multipart/form-data")) {
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      maxFileSize: 1024 * 1024 * 1024, // 1GB
    });

    form.parse(req, (err, fields: Fields, files: Files) => {
      if (err) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ message: "Invalid form data", error: err.message }));
      }

      // ----------------------
      // Parse JSON payload safely
      // ----------------------
      let payload: any = {};
      const payloadField = fields.payload;
      if (payloadField) {
        const payloadStr = Array.isArray(payloadField) ? payloadField[0] : payloadField;
        try {
          payload = JSON.parse(payloadStr ?? "{}");
        } catch {
          res.statusCode = 400;
          return res.end(JSON.stringify({ message: "Invalid JSON in payload" }));
        }
      }

      // Merge other text fields
      for (const key in fields) {
        if (key !== "payload") {
          const value = fields[key];
          payload[key] = Array.isArray(value) ? value[0] : value;
        }
      }

      // Normalize files
      const normalizedFiles: { [key: string]: File[] } = {};
      for (const key in files) {
        const f = files[key];
        if (f) {
          normalizedFiles[key] = Array.isArray(f) ? f : [f];
        }
      }

      // Attach files to payload and request
      payload.files = normalizedFiles;
      req.body = payload;
      req.files = normalizedFiles;

      next();
    });

    return;
  }

  // ----------------------
  // 3️⃣ Fallback for other content types
  // ----------------------
  let body = "";
  req.on("data", (chunk: Buffer) => (body += chunk.toString()));
  req.on("end", () => {
    req.body = body || {};
    next();
  });
};
