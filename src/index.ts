// -----------------------------
// Learning Management System (LMS)
// Main Entry Point
// -----------------------------
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import "./routes/api";
import { Router } from "./core/Router";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (!req.url || !req.method) return;
  Router.dispatch(req.url, req.method, req, res);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
