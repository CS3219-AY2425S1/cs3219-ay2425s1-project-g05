import test from "node:test";
import { categoriesIdToCategories } from "../constants/categories.js";
import BadRequestError from "../errors/BadRequestError.js";
import BaseError from "../errors/BaseError.js";
import ConflictError from "../errors/ConflictError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import NotFoundError from "../errors/NotFoundError.js";
import {
  ormCreateQuestion as _createQuestion,
  ormGetAllQuestions as _getAllQuestions,
  ormGetQuestionById as _getQuestionById,
  ormDeleteQuestionById as _deleteQuestionById,
  ormUpdateQuestionById as _updateQuestionById,
  ormGetFilteredQuestions as _getFilteredQuestions,
  ormFindQuestion as _findQuestion,
  ormGetQuestionsByDescription as _getQuestionsByDescription,
  ormGetQuestionsByTitleAndDifficulty as _getQuestionByTitleAndDifficulty,
  ormGetDistinctCategories as _getDistinctCategories,
} from "../models/orm.js";

const createQuestion = async (req, res, next) => {
  try {
    // CHECK WHETHER QUESTION WITH THE SAME DESCRIPTION ALREADY EXISTS
    const duplicateDescriptionQuestions = await _getQuestionsByDescription(
      req.body.description
    );

    if (duplicateDescriptionQuestions.length > 0) {
      throw new ConflictError(
        "A question with this description already exists"
      );
    }

    // CHECK WHETHER QUESTION WITH THE SAME TITLE AND DIFFICULTY ALREADY EXISTS (ONLY CHECK NOT DELETED ONES)
    const duplicateTitleAndDifficultyQuestions =
      await _getQuestionByTitleAndDifficulty(
        req.body.title,
        req.body.difficulty
      );

    if (duplicateTitleAndDifficultyQuestions.length > 0) {
      throw new ConflictError(
        "A question with this title and difficulty already exists"
      );
    }

    const categoriesString = req.body.categoriesId.map(
      (id) => categoriesIdToCategories[id]
    );

    // count number of isPublic test cases, !isPublic test cases, and total test cases  
    const metaData = {
      publicTestCaseCount: req.body.testCases.filter(testCase => testCase.isPublic).length,
      privateTestCaseCount: req.body.testCases.filter(testCase => !testCase.isPublic).length,
      totalTestCaseCount: req.body.testCases.length
    }

    const newQuestion = {
      ...req.body,
      categories: categoriesString,
      meta: metaData
    };

    const createdQuestion = await _createQuestion(newQuestion);
    return res
      .status(201)
      .json({ statusCode: 201, data: { question: createdQuestion } });
  } catch (err) {
    console.log(err);
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error creating the question")
    );
  }
};

const getAllQuestions = async (req, res, next) => {
  try {
    let allQuestions = await _getAllQuestions(req.query);

    if (allQuestions.length === 0) {
      throw new NotFoundError("No questions found");
    }

    return res.status(200).json({
      statusCode: 200,
      message: "All questions found successfully.",
      data: { questions: allQuestions },
    });
  } catch (err) {
    console.log(err);
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error retrieving question")
    );
  }
};

const getQuestionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    let foundQuestion = await _getQuestionById(id);

    if (foundQuestion.length === 0) {
      throw new NotFoundError("Question not found");
    }
    // if (!req.user) {
    //   throw new ForbiddenError("Please login to perform this action");
    // }
    // TODO: remove private test cases if not run service 
    // if (true) {
    //     const { testCases, ...rest } = foundQuestion[0].toObject();
    //     const publicTestCases = testCases.filter(
    //       (testCase) => testCase.isPublic
    //     );
    //     foundQuestion = {
    //       ...rest,
    //       testCases: publicTestCases, 
    //     };
      
    // }

    return res.status(200).json({
      statusCode: 200,
      message: "Question found successfully",
      data: { question: foundQuestion },
    });
  } catch (err) {
    console.log(err);
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error retrieving question")
    );
  }
};

const deleteQuestionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const questionToDelete = await _getQuestionById(id);
    if (questionToDelete.length === 0) {
      throw new NotFoundError("Question not found");
    }

    const result = await _deleteQuestionById(id);

    if (!result) {
      throw new NotFoundError("Question not found");
    }
    return res.status(200).json({
      statusCode: 200,
      message: "Question deleted successfully",
      data: { question: result },
    });
  } catch (err) {
    console.log(err);
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error deleting question")
    );
  }
};

const updateQuestionById = async (req, res, next) => {
  const { id } = req.params;
  const { description, title, difficulty, categoriesId, testCases } = req.body;

  try {
    // CHECK WHETHER QUESTION TO UPDATE EXISTS (AND NOT DELETED)
    const questionToUpdate = await _getQuestionById(id);

    if (questionToUpdate.length === 0) {
      throw new NotFoundError("Question to update cannot be found");
    }

    // CHECK FOR DUPLICATE DESCRIPTION IF PROVIDED
    if (description) {
      const duplicateDescriptionQuestions = await _getQuestionsByDescription(
        description
      );
      const otherQuestionsWithSameDescription =
        duplicateDescriptionQuestions.filter(
          (question) => question._id.toString() !== id
        );

      if (otherQuestionsWithSameDescription.length > 0) {
        throw new ConflictError(
          "A question with this description already exists"
        );
      }
    }

    // CHECK FOR DUPLICATE TITLE AND DIFFICULTY IF PROVIDED
    if (title || difficulty) {
      const titleToCheck = title || questionToUpdate[0].title;
      const difficultyToCheck = difficulty || questionToUpdate[0].difficulty;

      const duplicateTitleAndDifficultyQuestions =
        await _getQuestionByTitleAndDifficulty(titleToCheck, difficultyToCheck);
      const otherQuestionsWithSameTitleAndDifficulty =
        duplicateTitleAndDifficultyQuestions.filter(
          (question) => question._id.toString() !== id
        );

      if (otherQuestionsWithSameTitleAndDifficulty.length > 0) {
        throw new ConflictError(
          "A question with such title and difficulty already exists"
        );
      }
    }
    let updatedQuestionDetails = req.body;
    // UPDATE THE QUESTION
    if (categoriesId) {
      const categoriesString = req.body.categoriesId.map(
        (id) => categoriesIdToCategories[id]
      );

      updatedQuestionDetails = {
        ...req.body,
        categories: categoriesString,
      };
    }

    if (testCases) {
      const metaData = {
        publicTestCaseCount: testCases.filter(testCase => testCase.isPublic).length,
        privateTestCaseCount: testCases.filter(testCase => !testCase.isPublic).length,
        totalTestCaseCount: testCases.length
      }
      updatedQuestionDetails = {
        ...updatedQuestionDetails,
        meta: metaData
      }
    }

    console.log(updatedQuestionDetails)
    const updatedQuestion = await _updateQuestionById(
      id,
      updatedQuestionDetails
    );

    if (!updatedQuestion) {
      throw new NotFoundError("Question not found");
    }

    return res
      .status(200)
      .json({ success: true, status: 200, data: updatedQuestion });
  } catch (err) {
    console.log(err);
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error updating question")
    );
  }
};

const getFilteredQuestions = async (req, res, next) => {
  try {
    const { categories, categoriesId, difficulty } = req.query;

    // CHECK THAT BOTH CATEGORIES AND CATEGORIESID ARE NOT PROVIDED

    if (categories && categoriesId) {
      throw new BadRequestError(
        "Only categories or categoriesId should be provided, not both!"
      );
    }

    let categoriesString = [];
    if (categoriesId) {
      if (!Array.isArray(categoriesId)) {
        throw new BadRequestError("CategoriesId should be an array!");
      }
      categoriesString = categoriesId.map((id) => {
        const category = categoriesIdToCategories[id];
        if (!category) {
          throw new BadRequestError(`Category with id ${id} does not exist!`);
        }
        return category;
      });
    }

    // leaving it here for now - might remove it later (to not break anything from matching service)
    if (categories) {
      if (!Array.isArray(categories)) {
        throw new BadRequestError("Categories should be an array!");
      }
      categoriesString = categories;
      // check whether categories exist
      const distinctCategories = await _getDistinctCategories();
      const invalidCategories = categoriesString.filter(
        (category) => !distinctCategories.includes(category.toUpperCase())
      );

      if (invalidCategories.length > 0) {
        throw new BadRequestError(
          `Categories specified do not exist: ${invalidCategories.join(", ")}`
        );
      }
    }

    if (difficulty) {
      if (!Array.isArray(difficulty)) {
        throw new BadRequestError("Difficulty should be an array!");
      }
      if (
        difficulty.some(
          (diff) => !["EASY", "MEDIUM", "HARD"].includes(diff.toUpperCase())
        )
      ) {
        throw new BadRequestError(
          "Difficulty should be either EASY, MEDIUM or HARD!"
        );
      }
    }

    const filteredQuestions = await _getFilteredQuestions({
      categories: categoriesString,
      difficulty,
    });

    // No questions found that match both categories and difficulty
    if (filteredQuestions.length === 0) {
      throw new NotFoundError(
        "No questions with matching categories and difficulty found"
      );
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Questions found successfully",
      data: { questions: filteredQuestions },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error filtering question")
    );
  }
};

const findQuestion = async (req, res, next) => {
  try {
    const { categoriesId, difficulty, categories } = req.query;

    // CHECK THAT BOTH CATEGORIES AND CATEGORIESID ARE NOT PROVIDED
    if (categories && categoriesId) {
      throw new BadRequestError(
        "Only categories or categoriesId should be provided, not both!"
      );
    }

    let categoriesString = [];
    if (categoriesId) {
      if (!Array.isArray(categoriesId)) {
        throw new BadRequestError("CategoriesId should be an array!");
      }
      categoriesString = categoriesId.map((id) => {
        const category = categoriesIdToCategories[id];
        if (!category) {
          throw new BadRequestError(`Category with id ${id} does not exist!`);
        }
        return category;
      });
    }

    // leaving it here for now - might remove it later (to not break anything from matching service)
    if (categories) {
      if (!Array.isArray(categories)) {
        throw new BadRequestError("Categories should be an array!");
      }
      categoriesString = categories;
      // check whether categories exist
      const distinctCategories = await _getDistinctCategories();
      const invalidCategories = categoriesString.filter(
        (category) => !distinctCategories.includes(category.toUpperCase())
      );

      if (invalidCategories.length > 0) {
        throw new BadRequestError(
          `Categories specified do not exist: ${invalidCategories.join(", ")}`
        );
      }
    }

    if (difficulty) {
      if (!Array.isArray(difficulty)) {
        throw new BadRequestError("Difficulty should be an array!");
      }
      if (
        difficulty.some(
          (diff) => !["EASY", "MEDIUM", "HARD"].includes(diff.toUpperCase())
        )
      ) {
        throw new BadRequestError(
          "Difficulty should be either EASY, MEDIUM or HARD!"
        );
      }
    }

    const foundQuestion = await _findQuestion({
      categories: categoriesString,
      difficulty,
    });

    if (!foundQuestion) {
      console.log("No questions found");
      throw new NotFoundError(
        "No question with matching categories and difficulty found"
      );
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Question found!",
      data: { question: foundQuestion },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error finding question")
    );
  }
};

const getDistinctCategories = async (req, res, next) => {
  try {
    const distinctCategories = await _getDistinctCategories();

    if (distinctCategories.length === 0) {
      throw new NotFoundError("No categories found");
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Categories obtained successfully",
      data: { categories: distinctCategories },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error retrieving distinct categories")
    );
  }
};

export {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  updateQuestionById,
  getFilteredQuestions,
  findQuestion,
  getDistinctCategories,
};
