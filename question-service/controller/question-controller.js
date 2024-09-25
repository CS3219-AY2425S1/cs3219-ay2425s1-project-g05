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
      console.log(duplicateDescriptionQuestions);
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

    const question = await _createQuestion(req.body);
    return res.status(201).json({ success: true, status: 201, data: question });
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
    const questions = await _getAllQuestions(req.query);
    return res.json({ data: questions });
  } catch (err) {
    next(new BaseError(500, "Error retrieving questions"));
  }
};

const getQuestionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const question = await _getQuestionById(id);

    if (!question) {
      throw new NotFoundError("Question not found");
    }
    return res.json({ data: question });
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
      .json({ success: true, status: 200, message: "Question deleted!" });
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

  try {
    // CHECK WHETHER QUESTION TO UPDATE EXISTS
    const questionToUpdate = await _getQuestionById(id);

    if (!questionToUpdate) {
      throw new NotFoundError("Question not found");
    }
    // CHECK WHETHER UPDATED QUESTION HAS THE SAME DESCRIPTION AS ANOTHER QUESTION
    if (req.body.description) {
      const duplicateDescriptionQuestions = await _getQuestionsByDescription(
        req.body.description
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
    // CHECK WHETHER UPDATED QUESTION HAS THE SAME TITLE AND DIFFICULTY LEVEL AS ANOTHER QUESTION
    if (req.body.title || req.body.difficulty) {
      if (req.body.difficulty) {
        if (
          !["EASY", "MEDIUM", "HARD"].includes(
            req.body.difficulty.toUpperCase()
          )
        ) {
          throw new BadRequestError(
            "Difficulty should be either EASY, MEDIUM or HARD"
          );
        }
      }

      const titleToCheck = req.body.title
        ? req.body.title
        : questionToUpdate.title;
      const difficultyToCheck = req.body.difficulty
        ? req.body.difficulty
        : questionToUpdate.difficulty;
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

    const updatedQuestion = await _updateQuestionById(id, req.body);

    if (!updatedQuestion) {
      throw new NotFoundError("Question not found");
    }

    return res
      .status(200)
      .json({ success: true, status: 200, data: updatedQuestion });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error updating question")
    );
  }
};

const getFilteredQuestions = async (req, res, next) => {
  try {
    if (req.body.categories) {
      if (!Array.isArray(req.body.categories)) {
        throw new BadRequestError("Categories should be an array!");
      }
      const distinctCategories = await _getDistinctCategories();
      if (
        req.body.categories.some(
          (category) => !distinctCategories.includes(category.toUpperCase())
        )
      ) {
        throw new BadRequestError("Category does not exist!");
      }
    }
    if (req.body.difficulty) {
      if (!Array.isArray(req.body.difficulty)) {
        throw new BadRequestError("Difficulty should be an array!");
      }
      if (req.body.difficulty.some((difficulty) => !["EASY", "MEDIUM", "HARD"].includes(difficulty.toUpperCase()))) {
        throw new BadRequestError("Difficulty should be either EASY, MEDIUM or HARD!");
      }
    }
    const filteredQuestions = await _getFilteredQuestions(req.body);

    return res
      .status(200)
      .json({ success: true, status: 200, data: filteredQuestions });
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
    const foundQuestions = await _findQuestion(req.query);

    return res
      .status(200)
      .json({ success: true, status: 200, data: foundQuestions });
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
    return res
      .status(200)
      .json({ success: true, status: 200, data: distinctCategories });
  } catch (err) {
    next(new BaseError(500, "Error retrieving distinct categories"));
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
