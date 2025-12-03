import { AuthenticatedRequest } from "../../types/user"; 
import { Controller } from "../Controller";

export class StudentController extends Controller {
  public async index(request: AuthenticatedRequest, response: Response) {
    const user = request.user;
    return this.json(response, {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image
    });
  }
}
