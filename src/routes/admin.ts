
import { LoginController } from "../Controllers/Admin/Auth/LoginController";
import { CategoryController } from "../Controllers/Admin/Modules/Category/CategoryController";
import { SettingsController } from "../Controllers/Admin/Modules/Settings/SettingsController";
import { VendorController } from "../Controllers/Admin/Modules/Vendor/VendorController";
import { Router } from "../core/Router";

Router.group({ prefix: "api/admin" }, () => {
  Router.post("login", [LoginController, "login"]);

  Router.group({ middleware: ["auth"] }, function () {
    Router.get("settings", [SettingsController, "index"]);
    Router.put("settings/update",[SettingsController,"update"]);

    //vendors
    Router.get("vendors",[VendorController,'index']);

    //category
    Router.get("categories",[CategoryController,'index']);
    Router.post("create/category",[CategoryController,'store']);
    Router.put("update/category/:id",[CategoryController,'update']);
  });
});
