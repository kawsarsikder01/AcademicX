// -----------------------------
// Learning Management System (LMS)
// Main Entry Point
// -----------------------------
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import "./routes/api";
import "./routes/admin";
import "./routes/vendor";
import { Router } from "./core/Router";
import path from "path";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (!req.url || !req.method) return;


  if (req.url.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, req.url);
    try {
      Router.serveFile(filePath, req, res);
    } catch (err) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "File not found" }));
    }
    return;
  }


  Router.dispatch(req.url, req.method, req, res);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
