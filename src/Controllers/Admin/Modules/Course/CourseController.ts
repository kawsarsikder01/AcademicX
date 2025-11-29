import z from "zod";
import { Request } from "../../../../Middleware/JsonParser";
import { Course } from "../../../../Models/Course";
import { Controller } from "../../../Controller";

const courseStatus = z.object({
  status: z.enum(["published", "rejected"]),
  id: z.number().min(1),
});

export default class CourseController extends Controller {
  private courseModel = new Course();
  public async index(request: Request, response: Response) {
    const courses = await this.courseModel.with("category").all();
    this.json(response, courses);
  }

  public async updateStatus(request: Request, response: Response) {
    const data = request.body;

    const validateData = courseStatus.safeParse(data);

    if (!validateData.success) {
      const errors = validateData.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return this.json(response, { errors: errors }, 400);
    }

    const course = await this.courseModel.find(validateData.data?.id);

    if (!course) {
      return this.json(response, "Course Not Found", 404);
    }

    await this.courseModel.update(course.id, {
      status: validateData.data.status,
    });

    return this.json(response,"Status Update Successfully");
  }
}
