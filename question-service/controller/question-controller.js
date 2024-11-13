import { categoriesIdToCategories } from "../constants/categories.js";
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
  ormFindQuestion as _findQuestion,
  ormGetQuestionsByDescription as _getQuestionsByDescription,
  ormGetQuestionsByTitleAndDifficulty as _getQuestionByTitleAndDifficulty,
  ormGetDistinctCategoriesId as _getDistinctCategoriesId,
} from "../models/orm.js";
import { getCategoriesWithId } from "../utils/index.js";
import { isValidObjectId } from "../utils/services.js";

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
      return res.status(200).json({
        statusCode: 204,
        message: "No questions found.",
        data: { questions: [] },
      });
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
    // check if id is valid mongoose id
    if (!isValidObjectId(id)) {
      throw new NotFoundError("Question not found due to invalid id.");
    }

    let foundQuestion = await _getQuestionById(id);

    if (!foundQuestion) {
      throw new NotFoundError("Question not found");
    }

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
    if (!isValidObjectId(id)) {
      throw new NotFoundError("Question not found due to invalid id.");
    }

    const questionToDelete = await _getQuestionById(id);
    if (!questionToDelete) {
      throw new NotFoundError("Question not found");
    }

    let result = await _deleteQuestionById(id);

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
    if (!isValidObjectId(id)) {
      throw new NotFoundError("Question not found due to invalid id.");
    }
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

    let updatedQuestionDetails = req.body;


    let updatedQuestion = await _updateQuestionById(id, updatedQuestionDetails);

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

const findQuestion = async (req, res, next) => {
  try {
    const { categoriesId, difficulty } = req.query;

    let categoriesIdInt = null;

    if (categoriesId) {
      if (!Array.isArray(categoriesId)) {
        throw new BadRequestError("CategoriesId should be an array!");
      }
      // check whether categories exist
      let distinctCategories = await _getDistinctCategoriesId();
      categoriesIdInt = categoriesId.map((id) => parseInt(id));
      const invalidCategories = categoriesIdInt.filter(
        (category) => !distinctCategories.includes(category)
      );
      if (invalidCategories.length > 0) {
        throw new BadRequestError(
          `Questions with categoriesId specified do not exist: ${invalidCategories.join(
            ", "
          )}`
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

    let foundQuestion = await _findQuestion({
      categoriesId: categoriesIdInt,
      difficulty,
    });

    if (!foundQuestion) {
      console.log("No questions found with matching categories and difficulty");
      return res.status(200).json({
        statusCode: 204,
        message: "No questions found with matching categories and difficulty",
        data: { question: null },
      });
    }

    foundQuestion = {
      ...foundQuestion,
      categories: getCategoriesWithId(foundQuestion.categoriesId),
    };
    // add testcase ids to question.meta
    foundQuestion = addTestcaseIdToQuestion(foundQuestion);

    return res.status(200).json({
      statusCode: 200,
      message: "Question found!",
      data: { question: foundQuestion },
    });
  } catch (err) {
    console.log(err);
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error finding question")
    );
  }
};

const getDistinctCategoriesId = async (req, res, next) => {
  try {
    let distinctCategories = await _getDistinctCategoriesId();

    if (distinctCategories.length === 0) {
      return res.status(200).json({
        statusCode: 204,
        message: "No categories found.",
        data: { categories: { categoriesId: [], categories: [] } },
      });
    }

    // add a new array named categories string to distinctCategories
    // let the current distinctCategories be the categoriesId array
    distinctCategories = {
      categoriesId: distinctCategories,
      categories: distinctCategories.map((id) => categoriesIdToCategories[id]),
    };

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

const getTestCasesWithId = async (req, res, next) => {
  const { id } = req.params;

  try {

    if (!isValidObjectId(id)) {
      throw new NotFoundError("Question not found due to invalid id.");
    }

    let foundQuestion = await _getQuestionById(id);

    if (!foundQuestion) {
      throw new NotFoundError("Question not found");
    }

    if (
      !foundQuestion.testCases ||
      foundQuestion.testCases.length === 0
    ) {
      return res.status(200).json({
        statusCode: 204,
        message: "No testcases found for question",
        data: { testCase: [] },
      });
    }

    // get all testCases from foundQuestion
    const testCases = foundQuestion.testCases;

    return res.status(200).json({
      statusCode: 200,
      message: "Testcases for question found successfully",
      data: { testCase: testCases },
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

const addTestcaseIdToQuestion = (question) => {
  const testCases = question.testCases;
  const publicTestCases = testCases.filter((testCase) => testCase.isPublic);
  const privateTestCases = testCases.filter((testCase) => !testCase.isPublic);
  const publicTestCaseIds = publicTestCases.map((testCase) => testCase._id);
  const privateTestCaseIds = privateTestCases.map((testCase) => testCase._id);
  const totalTestCaseIds = testCases.map((testCase) => testCase._id);
  const meta = {
    ...question.meta,
    publicTestCaseIds,
    privateTestCaseIds,
    totalTestCaseIds,
  };
  return {
    ...question,
    meta,
  };
};

export {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  updateQuestionById,
  findQuestion,
  getDistinctCategoriesId,
  getTestCasesWithId,
};
