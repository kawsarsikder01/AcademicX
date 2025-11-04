import { Router } from "../core/Router";
import { auth } from "../Middleware/Auth";
import { jsonParser } from "../Middleware/JsonParser";

Router.use(jsonParser);
Router.registerMiddleware("auth", auth);
