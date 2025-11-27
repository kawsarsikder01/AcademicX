import { Model } from "../core/Model";
import { User } from "./User";

export class Payment extends Model {
  constructor() {
    super('payments');
  }

  user(){
    return this.belongsTo(User, "user_id");
  }
}
