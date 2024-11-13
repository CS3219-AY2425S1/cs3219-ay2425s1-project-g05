import { categoriesIdToCategories } from "../constants/categories.js";

const getCategoriesWithId = (categoriesId) => {
  return categoriesId.map((id) => categoriesIdToCategories[id]);
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

export { getCategoriesWithId, addTestcaseIdToQuestion };
