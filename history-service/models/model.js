
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: Object,
    required: [true, "Description is required"],
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
  difficulty: {
    type: String,
    enum: {
      values: ["EASY", "MEDIUM", "HARD"],
    },
    required: true,
  },
  solutionCode: {
    type: String,
    required: [true, "Solution code is required"],
  },
  link: {
    type: String,
  },
});

const testCaseResultSchema = new Schema({
  testCaseId: {
    type: String,
    required: [true, "Test case ID is required"],
  },
  expectedOutput: {
    type: String,
    required: [true, "Expected output is required"],
  },
  input: {
    type: String,
    required: [true, "Input is required"],
  },
  isPassed: {
    type: Boolean,
    required: [true, "isPassed is required"],
  },
  output: {
    type: String,
    required: [true, "Output is required"],
    // required: function () {
    //   // Output is required if isPassed is true
    //   return this.isPassed === true;
    // },
  },
  error: {
    type: String,
    required: [true, "Error is required"],
    // required: function () {
    //   // Output is required if isPassed is false
    //   return this.isPassed === false;
    // },
  },
  meta: {
    memory: {
      type: Number,
    },
    time: {
      type: String,
    },
  }
});

const attemptSchema = new Schema({
  userId: {
    type: String,
    required: [true, "userId is required"],
  },

  otherUserId: {
    type: String,
    required: [true, "otherUserId is required"],
  },
  question: {
    type: questionSchema,
    required: [true, "Question details are required"],
  },
  roomId: {
    type: String,
    required: [true, "Room ID is required"],
  },
  notes: {
    type: String,
    required: [true, "Notes is required"],
  },
  attemptCode: {
    type: String,
    required: [true, "Attempt code is required"],
  },
  testCaseResults: {
    type: [testCaseResultSchema],
    required: [true, "Test cases results are required"],
    validate: {
      validator: (value) => {
        return value.length > 0;
      },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const Attempt = mongoose.model("Attempt", attemptSchema);
export default Attempt;
