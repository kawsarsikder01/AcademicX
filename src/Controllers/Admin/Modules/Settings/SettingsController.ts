import { Setting } from "../../../../Models/Setting";
import { Controller } from "../../../Controller";
import { z } from "zod";
import { deleteFile, saveFile } from "../../../../Helper/Uploader";

const SettingSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  site_email: z.string().email().nullable(),
  site_phone: z.string().nullable(),
  site_address: z.string().nullable(),
  base_currency: z.string().min(1, "Base currency is required"),
  currency_symbol: z.string().min(1, "Currency symbol is required"),
  site_charge: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid site charge"),
  currency_position: z.enum(["left", "right"]).default("right"),
  has_space: z.boolean().nullable(),
  email_notifications: z.enum(["enabled", "disabled"]).default("enabled"),
  sms_notifications: z.enum(["enabled", "disabled"]).default("enabled"),
  in_app_notification: z.enum(["enabled", "disabled"]).default("enabled"),
  firebase_notification: z.enum(["enabled", "disabled"]).default("enabled"),
});

type SettingUpdateData = z.infer<typeof SettingSchema> & {
  site_logo?: string;
  site_favicon?: string;
  storage_type?: string;
};

export class SettingsController extends Controller {
  private settingsModel: Setting;
  constructor() {
    super();
    this.settingsModel = new Setting();
  }

  async index(request: Request, response: Response) {
    const settings = await this.settingsModel.firstOrNew();
    this.json(response, settings);
  }

  async update(request: Request, response: Response) {
    const validate = SettingSchema.safeParse(request.body);

    if (!validate.success) {
      const errors = validate.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return this.json(response, { errors: errors }, 400);
    }

    let data: SettingUpdateData = validate.data;

    const settings = await this.settingsModel.firstOrNew();

    const files = (request as any).files || {};
    let site_logo_url = settings.site_logo;
    let site_favicon_url = settings.site_favicon;

    if (files.site_logo?.[0]) {
      const logo = await saveFile(files.site_logo[0]);
      data = { ...data, site_logo: logo.path, storage_type: logo.driver };
      if (site_logo_url) deleteFile(site_logo_url);
    }

    if (files.site_favicon?.[0]) {
      const favicon = await saveFile(files.site_favicon[0]);
      data = {
        ...data,
        site_favicon: favicon.path,
        storage_type: favicon.driver,
      };
      if (site_favicon_url) deleteFile(site_favicon_url);
    }

     const setting = await this.settingsModel.update(settings.id, data);

    

    return this.json(response, {
      message: "Update settings successfully",
      data: setting
    });
  }
}
