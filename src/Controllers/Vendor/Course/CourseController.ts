import { z } from "zod";
import { Course } from "../../../Models/Course";
import { Lession } from "../../../Models/Lession";
import { MediaFile } from "../../../Models/MediaFile";
import { Quiz } from "../../../Models/Quiz";
import { QuizQuestion } from "../../../Models/QuizQuestion";
import { Category } from "../../../Models/Category";
import { db } from "../../../core/Db";
import { saveFile } from "../../../Helper/Uploader";
import { ServerResponse } from "http";
import { Controller } from "../../Controller";
import { AuthenticatedRequest } from "../../../Middleware/VendorAuth";

// --------------------------
// Zod Schemas
// --------------------------

const fileSchema = z.object({
  originalname: z.string(),
  path: z.string(),
}).optional();

const quizQuestionSchema = z.object({
  question: z.string().min(5),                     // match frontend key
  type: z.enum(["mcq", "written"]).default("mcq"),
  marks: z.number().default(1),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),                   // match frontend key
});

const quizSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  total_marks: z.number().default(0),
  passing_marks: z.number().default(0),
  duration_minutes: z.number().default(0),
  status: z.enum(["draft", "published"]).default("draft"),
  questions: z.array(quizQuestionSchema).default([]), // always array
});

const lessonSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  content: z.string().optional(),
  lesson_type: z.enum(["video", "live"]).default("video"),
  video_storage_type: z.enum(["local", "s3", "cdn"]).default("local"),
  live_start_time: z.string().datetime().optional(),
  live_end_time: z.string().datetime().optional(),
  position: z.number().optional(),
  quiz: quizSchema.nullable().optional(), 
});

const courseSchema = z.object({
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  category: z.string(),
  thumbnail: fileSchema.optional(),
  driver: z.string().max(20).optional(),
  price: z.coerce.number().nonnegative().default(0.0),
  discount: z.coerce.number().min(0).max(100).default(0.0),
  course_type: z.enum(["recorded", "live", "hybrid"]).default("recorded"),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  enrollment_close_date: z.string().datetime().optional(),
  streamType: z.enum(["internal", "external"]).default("internal"),
  status: z.enum(["draft", "pending", "published", "rejected"]).default("draft"),
  lessons: z.array(lessonSchema).optional(),
  introVideoUrl: z.string().nullable(),
  course_overview: z.string().min(50),
  total_hours: z.string()
});

// --------------------------
// Controller
// --------------------------

export class CourseController extends Controller {
  private courseModel = new Course();
  private lessonModel = new Lession();
  private mediaModel = new MediaFile();
  private quizModel = new Quiz();
  private quizQuestionModel = new QuizQuestion();
  private categoryModel = new Category();

  // List courses
  async index(request: AuthenticatedRequest, response: ServerResponse) {
    const vendor_id = request.user.id;
    const courses = await this.courseModel.with('category').where({ vendor_id }).all();
    this.json(response, courses);
  }

  async categories(request: Request, response: Response) {
    const categories = await this.categoryModel.where({ status: 1 }).all();
    return this.json(response, categories);
  }

  // Create course
  async store(request: AuthenticatedRequest, response: Response) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const vendor_id = request.user.id;
      const files = (request as any).files || {};
      const rawPayload = (request as any).body.payload || (request as any).body;
      const payload = this.parseCoursePayload(rawPayload);

      const validated = courseSchema.parse(payload);

      // 1️⃣ Create course first
      const courseId = await this.createCourse(conn, validated, vendor_id);

      // 2️⃣ Save thumbnail
      if (files.thumbnail?.[0]) {
        const savedThumb = await saveFile(files.thumbnail[0]);
        await this.mediaModel.create({
          mediable_type: "course",
          mediable_id: courseId,
          file_path: savedThumb.path,
          file_type: "image",
          storage_type: savedThumb.driver ?? "local",
        });
      }

      // 3️⃣ Create lessons
      if (validated.lessons?.length) {
        for (const [index, lesson] of validated.lessons.entries()) {
          const lessonId = await this.createLesson(conn, lesson, courseId, index);

          if (files[`lessonVideo_${index}`]?.[0]) {
            const savedVideo = await saveFile(files[`lessonVideo_${index}`][0]);
            await this.mediaModel.create({
              mediable_type: "lesson",
              mediable_id: lessonId,
              file_path: savedVideo.path,
              file_type: "video",
              storage_type: savedVideo.driver ?? "local",
            });
          }

          // Create single quiz
          if (lesson.quiz) {
            await this.createQuiz(conn, lesson.quiz, lessonId);
          }
        }
      }

      await conn.commit();

      this.json(response, { message: "Course created successfully", data: { id: courseId } });
    } catch (err: any) {
      await conn.rollback();
      console.error("Error creating course:", err);
      this.json(response, { message: "Failed to create course" }, 500);
    } finally {
      conn.release();
    }
  }

  // --------------------------
  // Payload parser
  // --------------------------
  private parseCoursePayload(rawPayload: any) {
    const payload: any = { ...rawPayload };

    if (!payload.lessons) return payload;

    payload.lessons = payload.lessons.map((lesson: any) => {
      if (lesson.quiz && typeof lesson.quiz === "string") {
        try {
          lesson.quiz = JSON.parse(lesson.quiz);
        } catch {
          lesson.quiz = null;
        }
      }

      lesson.quiz = lesson.quiz ? this.normalizeQuiz(lesson.quiz) : null;
      return lesson;
    });

    return payload;
  }

  private normalizeQuiz(rawQuiz: any) {
    if (!rawQuiz || !rawQuiz.questions) return null;

    const normalizedQuestions = rawQuiz.questions.map((q: any) => ({
      question: q.question || "",
      question_type: q.type || "mcq",
      marks: q.mark ?? 1,
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: q.answer ?? null,
    }));

    return {
      title: rawQuiz.title || "Untitled Quiz",
      description: rawQuiz.description || "",
      total_marks: rawQuiz.total_marks ?? 0,
      passing_marks: rawQuiz.passing_marks ?? 0,
      duration_minutes: rawQuiz.duration_minutes ?? 0,
      status: rawQuiz.status || "draft",
      questions: normalizedQuestions,
    };
  }

  // --------------------------
  // Private helpers
  // --------------------------
  private async createCourse(conn: any, data: any, vendorId: number) {
    const formatted = {
      vendor_id: vendorId,
      title: data.title,
      slug: await this.generateSlug(data.title),
      description: data.description ?? null,
      course_overview: data.course_overview ?? null,
      category_id: data.category ?? null,
      driver: data.driver ?? "local",
      price: data.price ?? 0.0,
      discount: data.discount ?? 0.0,
      course_type: data.course_type,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      enrollment_close_date: data.enrollment_close_date ?? null,
      streaming_server: data.streamType,
      status: "pending",
      introVideoUrl: data.introVideoUrl,
      total_hour: data.total_hours,
    };
    const course = await this.courseModel.create(formatted);
    return course.id;
  }

  private async createLesson(conn: any, lesson: any, courseId: number, index: number) {
    const formatted = {
      course_id: courseId,
      title: lesson.title,
      description: lesson.description ?? null,
      content: lesson.content ?? null,
      lesson_type: lesson.lesson_type,
      video_storage_type: lesson.video_storage_type ?? "local",
      live_start_time: lesson.live_start_time ?? null,
      live_end_time: lesson.live_end_time ?? null,
      position: lesson.position ?? index + 1,
    };
    const createdLesson = await this.lessonModel.create(formatted);
    return createdLesson.id;
  }

  private async createQuiz(conn: any, quizData: any, lessonId: number) {
    if (!quizData || !quizData.questions || !quizData.questions.length) return;

    const formattedQuiz = {
      lesson_id: lessonId,
      title: quizData.title,
      description: quizData.description ?? null,
      total_marks: quizData.total_marks ?? 0,
      passing_marks: quizData.passing_marks ?? 0,
      duration_minutes: quizData.duration_minutes ?? 0,
      status: "published",
    };

    const createdQuiz = await this.quizModel.create(formattedQuiz);

    for (const question of quizData.questions) {
      await this.quizQuestionModel.create({
        quiz_id: createdQuiz.id,
        question_text: question.question,
        question_type: question.type,
        marks: question.marks ?? 1,
        options: question.options ? JSON.stringify(question.options) : null,
        correct_answer: question.answer ?? null,
      });
    }
  }

  private async generateSlug(text: string) {
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
    while (await this.courseModel.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Step 4: Return the unique slug
    return uniqueSlug;
  }
}
