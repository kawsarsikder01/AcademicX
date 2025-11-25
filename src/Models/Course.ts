import { Model } from "../core/Model";
import { Category } from "./Category";
import { Lession } from "./Lession";
import { MediaFile } from "./MediaFile";
import { Vendor } from "./Vendor";

export class Course extends Model {
  constructor() {
    super("courses");
  }

  category() {
    return this.belongsTo(Category, "category_id"); // foreign key in courses table
  }

  vendor() {
    return this.belongsTo(Vendor, "vendor_id");
  }

  thumbnail() {
    return this.morphOne(MediaFile, "mediable");
  }

  lessions( ){
    return this.hasMany(Lession,"course_id");
  }
}
