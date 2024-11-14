import Question from "./model.js";
import { addTestcaseIdToQuestion, getCategoriesWithId } from "../utils/index.js";

const createQuestion = async (question) => {
  console.log(question);
  let newQuestion = question;
  // set difficulty to uppercase
  newQuestion.difficulty = question.difficulty.toUpperCase();
  // add meta to newQuestion
  const metaData = {
    publicTestCaseCount: question.testCases.filter(
      (testCase) => testCase.isPublic
    ).length,
    privateTestCaseCount: question.testCases.filter(
      (testCase) => !testCase.isPublic
    ).length,
    totalTestCaseCount: question.testCases.length,
  };

  newQuestion = {
    ...newQuestion,
    meta: metaData,
  };

  const formattedNewQuestion = new Question(newQuestion);
  let savedQuestion = await formattedNewQuestion.save();
  savedQuestion = savedQuestion.toObject();

  // add to meta: publicTestCaseId, privateTestCaseId, totalTestCaseId
  savedQuestion = addTestcaseIdToQuestion(savedQuestion);

  // delete testCases from savedQuestion
  delete savedQuestion.testCases;

  // add categories string to savedQuestion
  const categories = getCategoriesWithId(savedQuestion.categoriesId);
  savedQuestion = {
    ...savedQuestion,
    categories,
  };
  return savedQuestion;
};

const getAllQuestions = async () => {
  let questions = await Question.find({ isDeleted: false });
  // add categories string to questions
  questions = questions.map((question) => {
    const categories = getCategoriesWithId(question.categoriesId);
    return {
      ...question.toObject(),
      categories,
    };
  });
  // add testcase id to meta
  questions = questions.map((question) => addTestcaseIdToQuestion(question));
  return questions;
};

const getQuestionById = async (id) => {
  let foundQuestion = await Question.find({ _id: id, isDeleted: false });
  if (foundQuestion.length !== 0) {
    // add categories string to foundQuestion
    const categories = getCategoriesWithId(foundQuestion[0].categoriesId);
    foundQuestion = {
      ...foundQuestion[0].toObject(),
      categories,
    };
    // add testcase id to meta
    foundQuestion = addTestcaseIdToQuestion(foundQuestion);
    return foundQuestion;
  }

  return null;
};

const deleteQuestionById = async (id) => {
  // soft delete
  let deletedQuestion = await Question.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  if (deletedQuestion === null) {
    return null;
  }
  // add categories string to deletedQuestion
  const categories = getCategoriesWithId(deletedQuestion.categoriesId);
  deletedQuestion = {
    ...deletedQuestion.toObject(),
    categories,
  };
  // add testcase id to meta
  deletedQuestion = addTestcaseIdToQuestion(deletedQuestion);
  return deletedQuestion;
};

const updateQuestionById = async (id, question) => {
  const allowedFields = [
    "title",
    "description",
    "difficulty",
    "categoriesId",
    "testCases",
    "templateCode",
    "solutionCode",
    "link",
    "meta",
  ];
  const sanitizedQuestion = {};
  for (const key of allowedFields) {
    if (question[key] !== undefined) {
      sanitizedQuestion[key] = question[key];
    }
  }
  let updatedQuestion = await Question.findOneAndUpdate({ _id: { $eq: id } }, sanitizedQuestion, {
    new: true,
  });
  if (updatedQuestion === null) {
    return null;
  }
  // add categories string to updatedQuestion
  const categories = getCategoriesWithId(updatedQuestion.categoriesId);
  updatedQuestion = {
    ...updatedQuestion.toObject(),
    categories,
  };
  // add testcase id to meta
  updatedQuestion = addTestcaseIdToQuestion(updatedQuestion);
  return updatedQuestion;
};

const getRandomQuestionByCategoriesAndDifficulty = async (body) => {
  const { categoriesId, difficulty } = body;
  let filter = { isDeleted: false };
  if (categoriesId) {
    filter.categoriesId = {
      $in: categoriesId,
    };
  }
  if (difficulty) {
    filter.difficulty = {
      $in: difficulty.map((difficulty) => difficulty.toUpperCase()),
    };
  }
  const [randomQuestion] = await Question.aggregate([
    { $match: filter },
    { $sample: { size: 1 } },
  ]);
  return randomQuestion;
};

const getQuestionsByDescription = async (description) => {
  return Question.find({ description: { $eq: description }, isDeleted: false });
};

const getQuestionsByTitleAndDifficulty = async (title, difficulty) => {
  console.log(title, difficulty);
  return Question.find({
    title: { $eq: title },
    difficulty: { $eq: difficulty.toUpperCase() },
    isDeleted: false,
  });
};

const getDistinctCategories = async () => {
  const distinctCategories = await Question.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: "$categoriesId" },
    { $group: { _id: "$categoriesId" } },
    { $sort: { _id: 1 } },
  ]);

  const categoriesId = distinctCategories.map((item) => item._id);
  return categoriesId;
};

export {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  updateQuestionById,
  getQuestionsByDescription,
  getQuestionsByTitleAndDifficulty,
  getDistinctCategories,
  getRandomQuestionByCategoriesAndDifficulty,
};
