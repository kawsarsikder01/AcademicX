import { Setting } from "../Models/Setting";
import { Controller } from "./Controller";

export default class SettingsController extends Controller {
  private setting: Setting = new Setting();

  public async index(request: Request, response: Response) {
    const settting = await this.setting.firstOrNew();
    return this.json(response, settting);
  }
}
