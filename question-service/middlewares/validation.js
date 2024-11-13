import Joi from "joi";
import BadRequestError from "../errors/BadRequestError.js";

// Schema for testcase
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
  input: Joi.string().required().messages({
    "string.empty": "Input cannot be empty for all test cases",
    "any.required": "Input is required for all test cases",
    "string.min": "Input must be at least 1 character long for all test cases",
  }),
  isPublic: Joi.boolean().required().messages({
    "boolean.base": "isPublic must be a boolean",
    "any.required": "isPublic is required",
  }),
  meta: Joi.object().optional(),
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

const joiDescriptionSchema = Joi.object({
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
}).messages({
  "object.base":
    "Description is required as an object with descriptionHtml and descriptionText",
  "any.required":
    "Description is required with descriptionHtml and descriptionText",
});

// Schema for question - for create
const joiQuestionSchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 1 character long",
    "any.required": "Title is required",
  }),
  description: joiDescriptionSchema.required().messages({
    "object.base": "Description must be an object",
    "any.required":
      "Description is required with descriptionHtml and descriptionText",
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
  testCases: Joi.array().items(joiTestCaseSchema).min(1).required().messages({
    "array.base": "Test cases must be an array",
    "array.min": "At least one test case is required",
    "any.required":
      "Test cases are required and should have testCode, isPublic, and expectedOutput",
  }),
  templateCode: Joi.string().required().trim().min(1).messages({
    "string.min": "Template code cannot be empty",
    "string.empty": "Template code cannot be empty",
  }),
  solutionCode: Joi.string().required().trim().min(1).messages({
    "string.min": "Solution cannot be empty",
    "string.empty": "Solution code cannot be empty",
  }),
  link: Joi.string().optional().trim().min(1).messages({
    "string.min": "Link cannot be empty",
    "string.empty": "Link cannot be empty",
  }),
  isDeleted: Joi.boolean().default(false),
});

// Schema for question - for update
const joiPartialQuestionSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .messages({
      "string.empty": "Title cannot be empty",
      "string.min": "Title must be at least 1 character long",
    })
    .optional()
    .messages({
      "string.empty": "Title cannot be empty",
    }),
  description: joiDescriptionSchema.optional().messages({
    "object.base":
      "Description must be an object with descriptionHtml and descriptionText",
  }),
  categoriesId: Joi.array()
    .items(
      Joi.number().min(0).max(7).messages({
        "number.base": "Each category must be a number",
        "number.min": "Category must be between 0 and 7",
        "number.max": "Category must be between 0 and 7",
      })
    )
    .optional()
    .min(1)
    .messages({
      "array.base": "Categories must be an array",
      "array.min": "At least one category is required if specified",
    }),
  difficulty: Joi.string().valid("EASY", "MEDIUM", "HARD").optional().messages({
    "any.only": "Difficulty must be either HARD, MEDIUM, or EASY",
  }),
  testCases: Joi.array().items(joiTestCaseSchema).optional().messages({
    "array.base": "Test cases must be an array",
    "array.min": "At least one test case is required",
  }),
  templateCode: Joi.string().optional().trim().min(1).messages({
    "string.min": "Template code cannot be empty",
    "string.empty": "Template code cannot be empty",
  }),
  solutionCode: Joi.string().optional().trim().min(1).messages({
    "string.min": "Solution cannot be empty",
    "string.empty": "Solution code cannot be empty",
  }),
  link: Joi.string().optional().trim().min(1).messages({
    "string.min": "Link cannot be empty",
    "string.empty": "Link cannot be empty",
  }),
  isDeleted: Joi.boolean().optional(),
});

// VALIDATION MIDDLEWARE - CREATE QUESTION
const validateNewQuestion = (req, res, next) => {
  const questionToCreate = req.body;
  questionToCreate.difficulty = questionToCreate.difficulty.toUpperCase();
  const { error } = joiQuestionSchema.validate(req.body);

  if (error) {
    throw new BadRequestError(error.details[0].message);
  }

  next();
};

// VALIDATION MIDDLEWARE - UPDATE QUESTION
const validateUpdatedQuestion = (req, res, next) => {
  const questionToUpdate = req.body;
  if (questionToUpdate.difficulty) {
    questionToUpdate.difficulty = questionToUpdate.difficulty.toUpperCase();
  }
  const { error } = joiPartialQuestionSchema.validate(req.body);

  if (error) {
    throw new BadRequestError(error.details[0].message);
  }

  next();
};

export { validateNewQuestion, validateUpdatedQuestion };
