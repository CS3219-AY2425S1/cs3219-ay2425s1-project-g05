import mongoose from "mongoose";
import { publicDecrypt } from "node:crypto";
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

const metaSchema = new Schema({
  publicTestCaseCount: {
    type: Number,
    required: [true, "Public test case count is required"]
  },
  privateTestCaseCount: {
    type: Number,
    required: [true, "Private test case count is required"]
  },
  totalTestCaseCount: {
    type: Number,
    required: [true, "Total test case count is required"]
  }
})

const questionSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: Object,
    required: [true, "Description is required"]
  },
  categoriesId: {
    type: [Number],
    required: [true, "Categories is required"],
    validate: {
      validator: (value) => {
        return value.length > 0;
      },
    },
  },
  categories: {
    type: [String],
    required: [true, "Categories is required"],
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
  templateCode: {
    type: String
  },
  solutionCode: {
    type: String,
    required: [true, "Solution code is required"]
  },
  link: {
    type: String
  },
  meta: {
    type: metaSchema,
    required: [true, "Meta is required"]
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const Question = mongoose.model("Question", questionSchema);
export default Question;
