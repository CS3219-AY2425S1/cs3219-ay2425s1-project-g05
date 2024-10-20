import BadRequestError from "../errors/BadRequestError.js";
import BaseError from "../errors/BaseError.js";
import ConflictError from "../errors/ConflictError.js";
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

    const createdQuestion = await _createQuestion(req.body);
    return res
      .status(201)
      .json({ statusCode: 201, data: { question: createdQuestion } });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error creating the question")
    );
  }
};

const getAllQuestions = async (req, res, next) => {
  try {
    const allQuestions = await _getAllQuestions(req.query);

    if (allQuestions.length === 0) {
      throw new NotFoundError("No questions found");
    }

    return res
      .status(200)
      .json({
        statusCode: 200,
        message: "All questions found successfully.",
        data: { questions: allQuestions },
      });
  } catch (err) {
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
    const foundQuestion = await _getQuestionById(id);

    if (!foundQuestion) {
      throw new NotFoundError("Question not found");
    }
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: "Question found successfully",
        data: { question: foundQuestion },
      });
  } catch (err) {
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
    if (!questionToDelete) {
      throw new NotFoundError("Question not found");
    }

    const result = await _deleteQuestionById(id);

    if (!result) {
      throw new NotFoundError("Question not found");
    }
    return res
      .status(200)
      .json({
        statusCode: 200,
        message: "Question deleted successfully",
        data: { question: result },
      });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error deleting question")
    );
  }
};

const updateQuestionById = async (req, res, next) => {
  const { id } = req.params;
  const { description, title, difficulty } = req.body;

  try {
    // CHECK WHETHER QUESTION TO UPDATE EXISTS
    const questionToUpdate = await _getQuestionById(id);
    if (!questionToUpdate) {
      throw new NotFoundError("Question not found");
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
      const titleToCheck = title || questionToUpdate.title;
      const difficultyToCheck = difficulty || questionToUpdate.difficulty;

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

    // UPDATE THE QUESTION
    const updatedQuestion = await _updateQuestionById(id, req.body);
    if (!updatedQuestion) {
      throw new NotFoundError("Question not found");
    }

    return res
      .status(200)
      .json({
        statusCode: 200,
        message: "Question updated successfully",
        data: { question: updatedQuestion },
      });
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
    const { categories, difficulty } = req.query;
    if (categories) {
      if (!Array.isArray(categories)) {
        throw new BadRequestError("Categories should be an array!");
      }
      const distinctCategories = await _getDistinctCategories();
      if (
        categories.some(
          (category) => !distinctCategories.includes(category.toUpperCase())
        )
      ) {
        throw new BadRequestError("Category does not exist!");
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
      categories,
      difficulty,
    });

    if (filteredQuestions.length === 0) {
      throw new NotFoundError(
        "No questions with matching categories and difficulty found"
      );
    }

    return res
      .status(200)
      .json({
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
    const { categories, difficulty } = req.query;

    if (categories) {
      if (!Array.isArray(categories)) {
        throw new BadRequestError("Categories should be an array!");
      }
      const distinctCategories = await _getDistinctCategories();
      if (
        categories.some(
          (category) => !distinctCategories.includes(category.toUpperCase())
        )
      ) {
        throw new BadRequestError("Category does not exist!");
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

    const foundQuestion = await _findQuestion({ categories, difficulty });

    if (!foundQuestion) {
      console.log("No questions found");
      throw new NotFoundError(
        "No question with matching categories and difficulty found"
      );
    }

    return res
      .status(200)
      .json({ statusCode: 200, message: "Question found!", data: { question: foundQuestion } });
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

    return res
      .status(200)
      .json({
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
