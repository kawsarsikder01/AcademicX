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
  site_charge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid site charge"),
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

  async update(request: any, response: any) {
    try {
      // -----------------------------
      // 1. Extract form fields & files
      // -----------------------------
      const body = request.body || {};
      const files = request.files || {};

      // Convert boolean-type fields coming as strings ("true"/"false")
      const convertBoolean = (v: any) => {
        if (v === "true") return true;
        if (v === "false") return false;
        return v; // null allowed
      };

      const parsedData = {
        site_name: body.site_name,
        site_email: body.site_email || null,
        site_phone: body.site_phone || null,
        site_address: body.site_address || null,
        base_currency: body.base_currency,
        currency_symbol: body.currency_symbol,
        site_charge: body.site_charge,
        currency_position: body.currency_position,

        has_space: convertBoolean(body.has_space),
        email_notifications: body.email_notifications,
        sms_notifications: body.sms_notifications,
        in_app_notification: body.in_app_notification,
        firebase_notification: body.firebase_notification,
      };

      // -----------------------------
      // 2. Validate using Zod
      // -----------------------------
      const validate = SettingSchema.safeParse(parsedData);

      if (!validate.success) {
        const errors = validate.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        return this.json(response, { errors }, 400);
      }

      let data: SettingUpdateData = validate.data;

      // -----------------------------
      // 3. Fetch previous settings
      // -----------------------------
      const settings = await this.settingsModel.firstOrNew();

      let site_logo_url = settings.site_logo;
      let site_favicon_url = settings.site_favicon;

      // -----------------------------
      // 4. Handle file uploads
      // -----------------------------
      if (files.site_logo?.[0]) {
        const logo = await saveFile(files.site_logo[0]);
        data = {
          ...data,
          site_logo: logo.path,
          storage_type: logo.driver,
        };
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

      // -----------------------------
      // 5. Save to DB
      // -----------------------------
      const setting = await this.settingsModel.update(settings.id, data);

      return this.json(response, {
        message: "Update settings successfully",
        data: setting,
      });
    } catch (error) {
      console.error("UPDATE SETTINGS ERROR:", error);

      return this.json(
        response,
        {
          message: "Internal Server Error",
          error: typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error),
        },
        500
      );
    }
  }
}
