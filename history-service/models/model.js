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

const testCaseResultSchema = new Schema({
    isPassed: {
        type: Boolean,
        required: [true, "isPassed is required"],
    },
    output: {
        type: String,
        required: function() {
            // Output is required if isPassed is true
            return this.isPassed === true;
        },
    },
    error: {
        type: String,
        required: function() {
            // Output is required if isPassed is false
            return this.isPassed === false;
        },
    },
});

const attemptSchema = new Schema({
    userEmail: {
        type: String,
        required: [true, "User's email is required"],
    },
    
    otherUserEmail: {
        type: String,
        required: [true, "Other user email is required"],
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
    testCasesResults: {
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
    }
});

const Attempt = mongoose.model("Attempt", attemptSchema);
export default Attempt;
