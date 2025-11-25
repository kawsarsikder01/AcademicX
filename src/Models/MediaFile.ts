import { Model } from "../core/Model";
import { Lession } from "./Lession";
import { Course } from "./Course";

export class MediaFile extends Model {
  constructor() {
    super("media_files");
  }

  mediable() {
    // Morph relation: media can belong to Lesson or Course
    return this.morphTo("mediable", { Lession, Course });
  }
}
