import { Model } from "../core/Model";
import { MediaFile } from "./MediaFile";
import { Quiz } from "./Quiz";

export class Lession extends Model {
  constructor() {
    super("lessons");
  }

  quiz() {
    return this.hasOne(Quiz, "lesson_id","id");
  }

  files() {
    return this.morphMany(MediaFile, "mediable");
  }
}
