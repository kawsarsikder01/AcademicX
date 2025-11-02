// src/routes.ts
import { Router } from "./Router";
import { UserController } from "./controllers/UserController";
import { auth } from "./middleware/auth";
import { logger } from "./middleware/logger";

// Register named middleware
Router.registerMiddleware("auth", auth);
Router.registerMiddleware("logger", logger);

// Define middleware groups
Router.defineMiddlewareGroup("default", ["logger"]);
Router.defineMiddlewareGroup("authGroup", ["logger", "auth"]);

// Global middleware
Router.use(Router.getMiddleware("logger")); // runs on all routes

// Route groups
Router.group({ prefix: "/api", middleware: ["auth"] }, () => {
  Router.get("/users", [UserController, "index"]);
  Router.get("/users/:id", [UserController, "show"], Router.getMiddlewareGroup("default"));
  Router.post("/users", [UserController, "create"]);
});

// Static file route
Router.get("/file", (req, res) => Router.serveFile("./data/sample.txt", req, res));
