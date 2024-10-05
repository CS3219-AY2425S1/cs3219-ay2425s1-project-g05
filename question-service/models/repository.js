import Question from "./model.js";

const createQuestion = async (question) => {
  const newQuestion = new Question(question);
  newQuestion.difficulty = question.difficulty.toUpperCase();
  newQuestion.categories = question.categories.map((category) =>
    category.toUpperCase()
  );

  return newQuestion.save();
};

const getAllQuestions = async () => {
  return Question.find({ isDeleted: false });
};

const getQuestionById = async (id) => {
  return Question.findById(id);
};

const deleteQuestionById = async (id) => {
  // soft delete
  return Question.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

const updateQuestionById = async (id, question) => {
  return Question.findByIdAndUpdate(id, question, { new: true });
};

const getFilteredQuestions = async (body) => {
  const { categories, difficulty } = body;
  let filter = { isDeleted: false };
  if (categories) {
    filter.categories = {
      $in: categories.map((category) => category.toUpperCase()),
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
  return Question.find({ description: description, isDeleted: false });
};

const getQuestionsByTitleAndDifficulty = async (title, difficulty) => {
  return Question.find({
    title: title,
    difficulty: difficulty.toUpperCase(),
    isDeleted: false,
  });
};

const getDistinctCategories = async () => {
  const distinctCategories = await Question.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories" } },
    { $sort: { _id: 1 } },
  ]);

  const categories = distinctCategories.map((item) => item._id);
  return categories;
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
