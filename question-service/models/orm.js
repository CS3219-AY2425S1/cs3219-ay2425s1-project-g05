import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  updateQuestionById,
  getFilteredQuestions,
  getQuestionsByDescription,
  getQuestionsByTitleAndDifficulty,
  getDistinctCategories,
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

const ormGetFilteredQuestions = async (query) => {
  return getFilteredQuestions(query);
};

const ormFindQuestion = async (query) => {
  const filteredQuestions = await ormGetFilteredQuestions(query);
  const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
  const randomQuestion = filteredQuestions[randomIndex];
  return randomQuestion;
};

const ormGetQuestionsByDescription = async (description) => {
  return getQuestionsByDescription(description);
};

const ormGetQuestionsByTitleAndDifficulty = async (title, difficulty) => {
  return getQuestionsByTitleAndDifficulty(title, difficulty);
};

const ormGetDistinctCategories = async () => {
  return getDistinctCategories();
};

export {
  ormCreateQuestion,
  ormGetAllQuestions,
  ormGetQuestionById,
  ormDeleteQuestionById,
  ormUpdateQuestionById,
  ormGetFilteredQuestions,
  ormFindQuestion,
  ormGetQuestionsByDescription,
  ormGetQuestionsByTitleAndDifficulty,
  ormGetDistinctCategories,
};
