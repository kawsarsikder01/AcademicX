import z from "zod";
import { Category } from "../../../../Models/Category";
import { Controller } from "../../../Controller";

const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  status: z.number().nullable().default(1)
});

export class CategoryController extends Controller {
  private categoryModel: Category;
  constructor() {
    super();
    this.categoryModel = new Category();
  }

  async index(request: Request, response: Response) {
    const categories = await this.categoryModel.all();

    return this.json(response, categories);
  }

  async store(request: Request, response: Response) {
    const validate = CategorySchema.safeParse(request.body);

    if (!validate.success) {
      const errors = validate.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return this.json(response, { errors: errors }, 400);
    }

    const data = {
      name: validate.data.name,
      slug: await this.generateSlug(validate.data.name),
    };

   
     const category = await this.categoryModel.create(data); 

    return this.json(response, "Category create successfully");
  }

  async update(request: Request, response: Response, id: number) {
    
    const category = await this.categoryModel.findOne({ id: id });

    if (!category) {
      return this.json(response, "Category Not Found", 404);
    }

    const validate = CategorySchema.safeParse(request.body);

    if (!validate.success) {
      const errors = validate.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return this.json(response, { errors: errors }, 400);
    }

    const data = {
      name: validate.data.name,
      slug: await this.generateSlug(validate.data.name),
      status: validate.data.status
    };

    await this.categoryModel.update(id, data);


    return this.json(response, "Category update successfully");
  }

  async delete(request: Request, response: Response, id: number) {
    const deleteRes = this.categoryModel.delete(id);

    if (!deleteRes) {
      return this.json(response, "Category not found", 404);
    }

    return this.json(response, "Category delete successfully");
  }

  async generateSlug(text: string): Promise<string> {
    // Step 1: Generate base slug
    let slug = text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Step 2: Initialize counter
    let uniqueSlug = slug;
    let counter = 1;

    // Step 3: Keep checking until the slug is unique
    while (await this.categoryModel.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Step 4: Return the unique slug
    return uniqueSlug;
  