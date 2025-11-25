import { Controller } from "../Controller";
import { Course } from "../../Models/Course";
import { Quiz } from "../../Models/Quiz";
import { QuizQuestion } from "../../Models/QuizQuestion";
import { number } from "zod";
import { MediaFile } from "../../Models/MediaFile"; 

interface quiz {
  id: number;
  lesson_id: number;
  title: string;
  description: string;
  total_marks: number;
  passing_marks: number;
  duration_minutes: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: string;
  marks: number;
  options: string;
  correct_answer: string;
  created_at: string;
  updated_at: string;
}

interface file {
  id: number;
  mediable_type: string;
  mediable_id: number;
  file_path: string;
  file_type: string;
  storage_type: string;
  created_at: string;
}
export class CourseController extends Controller {
  private course: Course = new Course();
  private quiz: Quiz = new Quiz();
  private question: QuizQuestion = new QuizQuestion();
  private file: MediaFile = new MediaFile();

  async index(request: Request, response: Response) {

    const courses = await this.course
      .with("vendor", "thumbnail")
      .where({ status: "published", course_type: "recorded" })
      .paginate();

    return this.json(response, courses);
  }

  async details(request: Request, response: Response, slug: string) {
    const course = await this.course
      .with("vendor", "thumbnail", "lessions","category")
      .where({ slug })
      .first();

    const lessions = await this.formateLessions(course.lessions ?? []);

    course["lessions"] = lessions;

    return this.json(response, course);
  }

  async formateLessions(lessions: Array<any>) {
    if (!lessions.length) return [];

    const lessonIds = lessions.map((l) => l.id);

    // Fetch all quizzes
    const quizzes: quiz[] = await this.quiz
      .whereIn("lesson_id", lessonIds)
      .get();

    // Fetch all questions
    const quizIds = quizzes.map((q) => q.id);
    const questions: question[] = await this.question
      .whereIn("quiz_id", quizIds)
      .get();

    // Fetch all files
    const files: file[] = await this.file
      .whereIn("mediable_id", lessonIds)
      .where({ mediable_type: "lesson" })
      .get();

    // Map questions to quizzes
    const quizMap = quizzes.reduce((acc, quiz) => {
      acc[quiz.id] = {
        ...quiz,
        questions: questions.filter((q) => q.quiz_id === quiz.id),
      };
      return acc;
    }, {} as Record<number, any>);

    // Map lesson_id → quiz_id
    const lessonQuizMap = quizzes.reduce((acc, quiz) => {
      acc[quiz.lesson_id] = quiz.id;
      return acc;
    }, {} as Record<number, number>);

    // Map quizzes and files to lessons
    return lessions.map((l) => ({
      ...l,
      quiz: lessonQuizMap[l.id] ? quizMap[lessonQuizMap[l.id]] : null,
      files: files.filter((f) => f.mediable_id === l.id),
    }));
  }
}
