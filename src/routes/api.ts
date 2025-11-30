import SettingsController from "../Controllers/SettingsController";
import { CourseController } from "../Controllers/Web/CourseController";
import { PaymentController } from "../Controllers/Web/PaymentController";
import { Router } from "../core/Router";
import { auth } from "../Middleware/Auth";
import { dynamicParser } from "../Middleware/JsonParser";

Router.use(dynamicParser);
Router.registerMiddleware("auth", auth);



Router.group({prefix: "api"},function(){
    Router.get('courses',[CourseController,'index']);
    Router.get('course/:slug',[CourseController,'details']);
    Router.get('ipn',[PaymentController,'verifyPayment']);
    Router.get('settings',[SettingsController,'index']);

})