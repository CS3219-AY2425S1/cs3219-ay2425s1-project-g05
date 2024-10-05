import mongoose from "mongoose";
const Schema = mongoose.Schema;

const testCaseSchema = new Schema({
  testCode: {
    type: String,
    required: [true, "Test code is required"],
  },
  isPublic:{
    type: Boolean,
    required: [true, "isPublic status is required"]
  },
  meta: {
    type: Schema.Types.Mixed,
    // required: [true, "Meta is required"], -- Assuming optional for now
  },
  expectedOutput: {
    type: String,
    required: [true, "Expected output is required"],
  },
});

const questionSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: Object,
    required: [true, "Description is required"]
  },
  categories: {
    type: [String],
    required: [true, "Topic is required"],
    validate: {
      validator: (value) => {
        return value.length > 0;
      },
    },
  },
  difficulty: {
    type: String,
    enum: {
      values: ["EASY", "MEDIUM", "HARD"],
    },
    required: true,
  },
  testCases: {
    type: [testCaseSchema],
    required: [true, "Test cases are required"],
    validate: {
      validator: (value) => {
        return value.length > 0;
      },
    },
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const Question = mongoose.model("Question", questionSchema);
export default Question;
