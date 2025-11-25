import { LoginController } from "../Controllers/Vendor/Auth/LoginControler";
import { RegistrationController } from "../Controllers/Vendor/Auth/RegistrationController";
import { CourseController } from "../Controllers/Vendor/Course/CourseController";
import { ProfileController } from "../Controllers/Vendor/ProfileController";
import { Router } from "../core/Router";
import { auth } from "../Middleware/VendorAuth";
import { verfication } from "../Middleware/verification";


Router.registerMiddleware("vendor",auth)
Router.registerMiddleware("verification",verfication)

Router.group({prefix: 'api/vendor'},function(){
    Router.post('login',[LoginController,'login']);
    Router.post('register',[RegistrationController,'register']);

    Router.group({middleware:["vendor"]},()=>{
        Router.get('profile',[ProfileController,'index']);

        Router.group({middleware:["verification"]},()=>{
            //Manage course
            Router.get('courses',[CourseController,'index']);
            Router.get('categories',[CourseController,'categories']);
            Router.post('create/course',[CourseController,'store']);

        })
    });
});