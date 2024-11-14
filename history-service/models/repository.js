import Attempt from "./model.js";

const createAttempt = async (attempt) => {
  const newAttempt = new Attempt(attempt);
  const savedAttempt = await newAttempt.save();
  return savedAttempt;
};

const getAttempt = async (userId, roomId) => {
  return Attempt.find({
    userId: { $eq: userId },
    roomId: { $eq: roomId },
    isDeleted: false,
  });
};

const updateAttempt = async (userId, roomId, attempt) => {
  return Attempt.findOneAndUpdate(
    { userId: { $eq: userId }, roomId: { $eq: roomId }, isDeleted: false },
    attempt,
    { new: true }
  );
};

const deleteAttempt = async (userId, roomId) => {
  // soft delete
  return Attempt.findOneAndUpdate(
    { userId: { $eq: userId }, roomId: { $eq: roomId }, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
};

const getUserAttempts = async (userId) => {
  return Attempt.find({
    userId: { $eq: userId },
    isDeleted: false,
  });
};

const isDuplicateAttempt = async (userId, otherUserId, roomId) => {
  console.log(userId, otherUserId, roomId);
  const attempt = await Attempt.find({
    userId: { $eq: userId },
    otherUserId: { $eq: otherUserId },
    roomId: { $eq: roomId },
  });
  console.log(attempt);

  const attemptCheck = await Attempt.find({
    roomId: { $eq: roomId },
  });

  console.log(attemptCheck);
  return attempt.length > 0;
};

export {
  createAttempt,
  getAttempt,
  updateAttempt,
  deleteAttempt,
  getUserAttempts,
  isDuplicateAttempt,
};
