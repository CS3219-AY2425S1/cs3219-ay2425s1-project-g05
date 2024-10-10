import {
  createAttempt,
  deleteAttempt,
  getAttempt,
  getUserAttempts,
  updateAttempt,
  isDuplicateAttempt,
} from "../models/repository.js";

const ormCreateAttempt = async (attempt) => {
  return createAttempt(attempt);
};

const ormGetAttempt = async (userEmail, roomId) => {
  return getAttempt(userEmail, roomId);
};

const ormUpdateAttempt = async (userEmail, roomId, attemptNotes) => {
  return updateAttempt(userEmail, roomId, attemptNotes);
};

const ormDeleteAttempt = async (userEmail, roomId) => {
  return deleteAttempt(userEmail, roomId);;
};

const ormGetUserAttempts = async (userEmail) => {
  return getUserAttempts(userEmail);
};

const ormIsDuplicateAttempt = async (
  userEmail,
  otherUserEmail,
  questionId,
  roomId
) => {
  return isDuplicateAttempt(userEmail, otherUserEmail, questionId, roomId);
};

export {
  ormCreateAttempt,
  ormGetAttempt,
  ormUpdateAttempt,
  ormDeleteAttempt,
  ormGetUserAttempts,
  ormIsDuplicateAttempt,
};
