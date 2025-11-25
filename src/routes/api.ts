import { CourseController } from "../Controllers/Web/CourseController";
import { Router } from "../core/Router";
import { auth } from "../Middleware/Auth";
import { dynamicParser } from "../Middleware/JsonParser";

Router.use(dynamicParser);
Router.registerMiddleware("auth", auth);



Router.group({prefix: "api"},function(){
    Router.get('courses',[CourseController,'index']);
    Router.get('course/:slug',[CourseController,'details']);
})