import Joi from "joi";
import BadRequestError from "../errors/BadRequestError.js";


const joiTestCaseMetaSchema = Joi.object({
  memory: Joi.number().required().messages({
    "number.base": "Memory must be a number",
    "any.required": "Memory is required",
  }),
  time: Joi.string().required().messages({
    "string.empty": "Time cannot be empty",
    "any.required": "Time is required",
  }),
}).messages({
  "object.base": "Meta is required as an object with memory and time",
  "any.required": "Meta is required with memory and time",
}).optional();

const joiTestCaseResultSchema = Joi.object({
  testCaseId: Joi.string()
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
  isPassed: Joi.boolean().required().messages({
    "boolean.base": "isPassed must be a boolean",
    "any.required": "isPassed is required",
  }),
  meta: joiTestCaseMetaSchema, // assuming optional for now
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
  input: Joi.string().trim().min(1).required().messages({
    "string.empty": "Input cannot be empty",
    "string.min": "Input must be at least 1 character long",
    "any.required": "Input is required",
  }),
  output: Joi.string().required().messages({
    "any.required": "Output is required",
  }),
  error: Joi.string().required().messages({
    "any.required": "Error is required",
  }),
}).messages({
  "object.base":
    "Each testcase results should have testCaseId, isPassed, and expectedOutput",
});

const joiDescriptionSchema = Joi.object(
  {
    descriptionHtml: Joi.string().trim().min(1).required().messages({
      "string.empty": "DescriptionHtml is required in description",
      "string.min": "DescriptionHtml must be at least 1 character long",
      "any.required": "DescriptionHtml is required in description",
    }),
    descriptionText: Joi.string().trim().min(1).required().messages({
      "string.empty": "DescriptionText is required in description",
      "string.min": "DescriptionText must be at least 1 character long",
      "any.required": "DescriptionText is required in description",
    }),
  }
).messages({
  "object.base": "Description is required as an object with descriptionHtml and descriptionText",
  "any.required": "Description is required with descriptionHtml and descriptionText",
});


const joiAttemptSchema = Joi.object({
  otherUserId: Joi.string().trim().min(1).required().messages({
    "string.empty": "otherUserId cannot be empty",
    "string.min": "otherUserId must be at least 1 character long",
    "any.required": "otherUserId is required",
  }),
  question: Joi.object({
    title: Joi.string().required().messages({
      "string.empty": "Title is required",
      "any.required": "Title is required",
    }),
    description: joiDescriptionSchema.required().messages({
      "object.base": "Description must be an object",
      "any.required": "Description is required with descriptionHtml and descriptionText",
    }),
    categoriesId: Joi.array()
      .items(
        Joi.number().min(0).max(7).messages({
          "number.base": "Each category must be a number",
          "number.min": "Category must be between 0 and 7",
          "number.max": "Category must be between 0 and 7",
        })
      )
      .required()
      .min(1)
      .messages({
        "array.base": "Categories must be an array",
        "array.min": "At least one category is required if specified",
      }),
    difficulty: Joi.string().valid("HARD", "MEDIUM", "EASY").required().messages({
      "any.only": "Difficulty must be either HARD, MEDIUM, or EASY",
      "any.required": "Difficulty is required",
    }),
    link: Joi.string().trim().min(1).required().messages({
      "string.empty": "Link cannot be empty",
      "string.min": "Link must be at least 1 character long",
      "any.required": "Link is required",
    }),
    solutionCode: Joi.string().trim().min(1).required().messages({
      "string.empty": "Solution code cannot be empty",
      "string.min": "Solution code must be at least 1 character long",
      "any.required": "Solution code is required",
    }),
  }),
  testCaseResults: Joi.array().items(joiTestCaseResultSchema).min(1).required().messages({
    "array.base": "testCaseResults must be an array",
    "array.min": "At least one testCaseResult is required",
    "any.required":
      "testCaseResults are required",
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
  })
}).custom((value, helpers) => {
  // Check if userId and otherUserId are the same
  if (value.userId === value.otherUserId) {
    return helpers.message("UserId and otherUserId cannot be the same.");
  }
  return value;
}, "Custom validation for userId and otherUserId");

const validateAttempt = (req, res, next) => {
  console.log(req.body);
  const { error } = joiAttemptSchema.validate(req.body);
  if (error) {
    throw new BadRequestError(error.details[0].message);
  }
  next();
};

export { validateAttempt };
