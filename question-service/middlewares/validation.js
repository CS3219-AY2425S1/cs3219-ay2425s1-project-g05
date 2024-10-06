import Joi from "joi";
import BadRequestError from "../errors/BadRequestError.js";

// Schema for testcase
const joiTestCaseSchema = Joi.object({
  testCode: Joi.string().trim().min(1).messages({
    "string.empty": "All testCode cannot be empty", 
    "string.min": "All testCode must be at least 1 character long",
  }).required().messages({
    "string.empty": "Test code cannot be empty",
    "any.required": "Test code is required", 
  }),
  isPublic: Joi.boolean().required().messages({
    "boolean.base": "isPublic must be a boolean",
    "any.required": "isPublic is required",
  }),
  meta: Joi.any().optional(), // assuming optional for now
  expectedOutput: Joi.string().trim().min(1).messages({
    "string.empty": "All expectedOutput cannot be empty", 
    "string.min": "All expectedOutput must be at least 1 character long",
  }).required().messages({
    "string.empty": "Expected output cannot be empty",
    "any.required": "Expected output is required", 
  }),
}).messages({
  'object.base': 'Each test case should have testCode, isPublic, and expectedOutput',
});

// Partial schema for question - for create
const joiQuestionSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Title is required",
    "any.required": "Title is required",
  }),
  description: Joi.object().required().messages({
    "object.base": "Description is required as an object",
    "any.required": "Description is required",
  }),
  categories: Joi.array()
    .items(Joi.string().trim().min(1).messages({
      "string.empty": "Each category cannot be empty", 
      "string.min": "Each category must be at least 1 character long",
    }))
    .min(1)
    .required()
    .messages({
      "array.base": "Categories must be an array",
      "array.min": "At least one topic is required",
      "any.required": "Categories are required",
    }),
  difficulty: Joi.string()
    .valid("HARD", "MEDIUM", "EASY")
    .required()
    .messages({
      "any.only": "Difficulty must be either HARD, MEDIUM, or EASY",
      "any.required": "Difficulty is required",
    }),
  testCases: Joi.array()
    .items(joiTestCaseSchema)
    .min(1)
    .required()
    .messages({
      "array.base": "Test cases must be an array",
      "array.min": "At least one test case is required",
      'any.required': 'Test cases are required and should have testCode, isPublic, and expectedOutput',
    }),
  isDeleted: Joi.boolean().default(false),
});

const joiPartialQuestionSchema = Joi.object({
  title: Joi.string().trim().min(1).messages({
    "string.empty": "Title cannot be empty", 
    "string.min": "Title must be at least 1 character long",
  }).optional().messages({
    "string.empty": "Title cannot be empty",
  }),
  description: Joi.object().optional().messages({
    "object.base": "Description must be an object",
  }),
  categories: Joi.array()
  .items(Joi.string().trim().min(1).messages({
    "string.empty": "Each category cannot be empty", 
    "string.min": "Each category must be at least 1 character long",
  }))
    .optional()
    .messages({
      "array.base": "Categories must be an array",
      "array.min": "At least one topic is required",
    }),
  difficulty: Joi.string().valid("EASY", "MEDIUM", "HARD").optional().messages({
    "any.only": "Difficulty must be either HARD, MEDIUM, or EASY",
  }),
  testCases: Joi.array().items(joiTestCaseSchema).optional().messages({
    "array.base": "Test cases must be an array",
    "array.min": "At least one test case is required",
  }),
  isDeleted: Joi.boolean().optional(),
});

// VALIDATION MIDDLEWARE - CREATE QUESTION
const validateNewQuestion = (req, res, next) => {
  const questionToCreate = req.body;
  console.log(questionToCreate);
  questionToCreate.difficulty = questionToCreate.difficulty.toUpperCase();
  const { error } = joiQuestionSchema.validate(req.body);

  if (error) {
    console.log(error);
    throw new BadRequestError(error.details[0].message);
  }

  next();
};

// VALIDATION MIDDLEWARE - UPDATE QUESTION
const validateUpdatedQuestion = (req, res, next) => {
  const questionToUpdate = req.body;
  console.log(questionToUpdate);
  if (questionToUpdate.difficulty) {
    questionToUpdate.difficulty = questionToUpdate.difficulty.toUpperCase();
  }
  if (questionToUpdate.categories) {
    questionToUpdate.categories = questionToUpdate.categories.map((category) =>
      category.toUpperCase()
    );
  }
  const { error } = joiPartialQuestionSchema.validate(req.body);

  if (error) {
    throw new BadRequestError(error.details[0].message);
  }

  next();
};

export { validateNewQuestion, validateUpdatedQuestion } ;
