import Joi from "joi";
import BadRequestError from "../../question-service/errors/BadRequestError.js";

const joiTestCaseSchema = Joi.object({
  testCode: Joi.string()
    .trim()
    .min(1)
    .messages({
      "string.empty": "All testCode cannot be empty",
      "string.min": "All testCode must be at least 1 character long",
    })
    .required()
    .messages({
      "string.empty": "Test code cannot be empty",
      "any.required": "Test code is required",
    }),
  isPublic: Joi.boolean().required().messages({
    "boolean.base": "isPublic must be a boolean",
    "any.required": "isPublic is required",
  }),
  meta: Joi.any().optional(), // assuming optional for now
  expectedOutput: Joi.string()
    .trim()
    .min(1)
    .messages({
      "string.empty": "All expectedOutput cannot be empty",
      "string.min": "All expectedOutput must be at least 1 character long",
    })
    .required()
    .messages({
      "string.empty": "Expected output cannot be empty",
      "any.required": "Expected output is required",
    }),
}).messages({
  "object.base":
    "Each test case should have testCode, isPublic, and expectedOutput",
});


const joiAttemptSchema = Joi.object({
  userEmail: Joi.string().trim().min(1).required().messages({
    "string.empty": "User's email cannot be empty",
    "string.min": "User's email must be at least 1 character long",
    "any.required": "User's email is required",
  }),
  otherUserEmail: Joi.string().trim().min(1).required().messages({
    "string.empty": "Other User's email cannot be empty",
    "string.min": "Other User's email must be at least 1 character long",
    "any.required": "Other User's email is required",
  }),
  question: Joi.object({
    title: Joi.string().required().messages({
      "string.empty": "Title is required",
      "any.required": "Title is required",
    }),
    description: Joi.object().required().messages({
      "object.base": "Description is required as an object",
      "any.required": "Description is required",
    }),
    categories: Joi.array()
      .items(
        Joi.string().trim().min(1).messages({
          "string.empty": "Each category cannot be empty",
          "string.min": "Each category must be at least 1 character long",
        })
      )
      .min(1)
      .required()
      .messages({
        "array.base": "Categories must be an array",
        "array.min": "At least one topic is required",
        "any.required": "Categories are required",
      }),
    difficulty: Joi.string().valid("HARD", "MEDIUM", "EASY").required().messages({
      "any.only": "Difficulty must be either HARD, MEDIUM, or EASY",
      "any.required": "Difficulty is required",
    }),
    testCases: Joi.array().items(joiTestCaseSchema).min(1).required().messages({
      "array.base": "Test cases must be an array",
      "array.min": "At least one test case is required",
      "any.required":
        "Test cases are required and should have testCode, isPublic, and expectedOutput",
    }),
    isDeleted: Joi.boolean().default(false),
  }),
  roomId: Joi.string().trim().min(1).required().messages({
    "string.empty": "Room ID cannot be empty",
    "string.min": "Room ID must be at least 1 character long",
    "any.required": "Room ID is required",
  }),
  notes: Joi.string().allow("").required().messages({
    "any.required": "Notes is required",
  }),
  attemptCode: Joi.string().allow("").required().messages({
    "any.required": "Code is required",
  }),
  testCasesResults: Joi.array()
    .items(
      Joi.object({
        isPassed: Joi.boolean().required().messages({
          "any.required": "isPassed is required",
        }),
        output: Joi.string().when("isPassed", {
          is: true,
          then: Joi.string().required().messages({
            "any.required": "Output is required",
          }),
        }),
        error: Joi.string().when("isPassed", {
          is: false,
          then: Joi.string().required().messages({
            "any.required": "Error is required",
          }),
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Test cases results must be an array",
      "array.min": "At least one test case result is required",
      "any.required": "Test cases results are required",
    }),
}).custom((value, helpers) => {
  // Check if userId and otherUserId are the same
  if (value.userEmail === value.otherUserEmail) {
    return helpers.message("UserEmail and otherUserEmail cannot be the same.");
  }
  return value;
}, "Custom validation for userId and otherUserId");

const validateAttempt = (req, res, next) => {
  const { error } = joiAttemptSchema.validate(req.body);
  if (error) {
    throw new BadRequestError(error.details[0].message);
  }
  next();
};

export { validateAttempt };
