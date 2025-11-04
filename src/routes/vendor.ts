import { LoginController } from "../Controllers/Vendor/Auth/LoginControler";
import { RegistrationController } from "../Controllers/Vendor/Auth/RegistrationController";
import { ProfileController } from "../Controllers/Vendor/ProfileController";
import { Router } from "../core/Router";
import { auth } from "../Middleware/VendorAuth";


Router.registerMiddleware("vendor",auth)

Router.group({prefix: 'api/vendor'},function(){
    Router.post('login',[LoginController,'login']);
    Router.post('register',[RegistrationController,'register']);

    Router.group({middleware:["vendor"]},()=>{
        Router.get('profile',[ProfileController,'index']);
    });
});