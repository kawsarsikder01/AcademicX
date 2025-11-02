import { LoginController } from "../Controllers/Admin/Auth/LoginController";
import { SettingsController } from "../Controllers/Admin/Modules/Settings/SettingsController";
import { Router } from "../core/Router";
import { auth } from "../Middleware/Auth";
import { jsonParser } from "../Middleware/JsonParser";

Router.use(jsonParser);
Router.registerMiddleware("auth", auth);

Router.group({ prefix: "api/admin" }, () => {
  Router.post("login", [LoginController, "login"]);

  Router.group({ middleware: ["auth"] }, function () {
    Router.get("settings", [SettingsController, "index"]);
    Router.put("settings/update",[SettingsController,"update"]);
  });
});
