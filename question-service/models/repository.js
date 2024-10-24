import Question from "./model.js";

const createQuestion = async (question) => {
  console.log(question);
  const newQuestion = new Question(question);
  newQuestion.difficulty = question.difficulty.toUpperCase();

  return newQuestion.save();
};

const getAllQuestions = async () => {
  return Question.find({ isDeleted: false });
};

const getQuestionById = async (id) => {
  return Question.find({ _id: id, isDeleted: false });
};

const deleteQuestionById = async (id) => {
  // soft delete
  return Question.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

const updateQuestionById = async (id, question) => {
  const allowedFields = ['title', 'description', 'difficulty', 'categoriesId', 'testCases', 'templateCode', 'solutionCode', 'link', 'meta'];
  const sanitizedQuestion = {};
  for (const key of allowedFields) {
    if (question[key] !== undefined) {
      sanitizedQuestion[key] = question[key];
    }
  }
  return Question.findByIdAndUpdate(id, sanitizedQuestion, { new: true });
};

const getFilteredQuestions = async (body) => {
  const { categoriesId, difficulty } = body;
  let filter = { isDeleted: false };
  console.log(categoriesId)
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
  return Question.find(filter);
};

const getQuestionsByDescription = async (description) => {
  return Question.find({ description: { $eq: description }, isDeleted: false });};

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
  getFilteredQuestions,
  getQuestionsByDescription,
  getQuestionsByTitleAndDifficulty,
  getDistinctCategories,
};
