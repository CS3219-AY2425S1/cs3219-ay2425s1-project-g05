import Attempt from "./model.js";

const createAttempt = async (attempt) => {
  const newAttempt = new Attempt(attempt);
  const savedAttempt = await newAttempt.save();
  return savedAttempt;
};

const getAttempt = async (userEmail, roomId) => {
  return Attempt.find({
    userEmail: { $eq: userEmail },
    roomId: { $eq: roomId },
    isDeleted: false,
  });
};

const updateAttempt = async (userEmail, roomId, attempt) => {
  return Attempt.findOneAndUpdate(
    { userEmail: { $eq: userEmail }, roomId: { $eq: roomId }, isDeleted: false },
    attempt,
    { new: true }
  );
};

const deleteAttempt = async (userEmail, roomId) => {
  // soft delete
  return Attempt.findOneAndUpdate(
    { userEmail: { $eq: userEmail }, roomId: { $eq: roomId }, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
};

const getUserAttempts = async (userEmail) => {
  return Attempt.find({
    userEmail: { $eq: userEmail },
    isDeleted: false,
  });
};

const isDuplicateAttempt = async (userEmail, otherUserEmail, questionId, roomId) => {
  const attempt = await Attempt.findOne({
    userEmail: { $eq: userEmail },
    otherUserEmail: { $eq: otherUserEmail },
    questionId: { $eq: questionId },
    roomId: { $eq: roomId },
    isDeleted: false,
  });
  return !!attempt;
};

export {
  createAttempt,
  getAttempt,
  updateAttempt,
  deleteAttempt,
  getUserAttempts,
  isDuplicateAttempt,
};
