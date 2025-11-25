import { Model } from "../core/Model";
import { QuizQuestion } from "./QuizQuestion";

export class Quiz extends Model 
{
    constructor()
    {
        super('quizzes')
    }

    questions(){
        return this.hasMany(QuizQuestion,"quiz_id","id");
    }
}