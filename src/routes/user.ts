import { LoginController } from "../Controllers/User/LoginController";
import { RegistrationController } from "../Controllers/User/RegistrationController";
import { auth } from "../Middleware/UserAuth";
import { Router } from "../core/Router";

Router.registerMiddleware("user",auth);


Router.group({prefix: 'api/user'},function(){
    Router.post('login',[LoginController,'login']);
    Router.post('register',[RegistrationController,'register']);
})