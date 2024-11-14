import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  updateQuestionById,
  getQuestionsByDescription,
  getQuestionsByTitleAndDifficulty,
  getDistinctCategories,
  getRandomQuestionByCategoriesAndDifficulty,
} from "./repository.js";

const ormCreateQuestion = async (question) => {
  return createQuestion(question);
};

const ormGetAllQuestions = async () => {
  return getAllQuestions();
};

const ormGetQuestionById = async (id) => {
  return getQuestionById(id);
};

const ormDeleteQuestionById = async (id) => {
  return deleteQuestionById(id);
};

const ormUpdateQuestionById = async (id, question) => {
  return updateQuestionById(id, question);
};

const ormFindQuestion = async (query) => {
  const randomQuestion = await getRandomQuestionByCategoriesAndDifficulty(query);
  return randomQuestion;
};

const ormGetQuestionsByDescription = async (description) => {
  return getQuestionsByDescription(description);
};

const ormGetQuestionsByTitleAndDifficulty = async (title, difficulty) => {
  return getQuestionsByTitleAndDifficulty(title, difficulty);
};

const ormGetDistinctCategoriesId = async () => {
  return getDistinctCategories();
};

export {
  ormCreateQuestion,
  ormGetAllQuestions,
  ormGetQuestionById,
  ormDeleteQuestionById,
  ormUpdateQuestionById,
  ormFindQuestion,
  ormGetQuestionsByDescription,
  ormGetQuestionsByTitleAndDifficulty,
  ormGetDistinctCategoriesId,
};
