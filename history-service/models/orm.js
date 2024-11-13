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

const ormGetAttempt = async (userId, roomId) => {
  return getAttempt(userId, roomId);
};

const ormUpdateAttempt = async (userId, roomId, attemptNotes) => {
  return updateAttempt(userId, roomId, attemptNotes);
};

const ormDeleteAttempt = async (userId, roomId) => {
  return deleteAttempt(userId, roomId);;
};

const ormGetUserAttempts = async (userId) => {
  return getUserAttempts(userId);
};

const ormIsDuplicateAttempt = async (
  userId,
  otherUserId,
  roomId
) => {
  return isDuplicateAttempt(userId, otherUserId, roomId);
};

export {
  ormCreateAttempt,
  ormGetAttempt,
  ormUpdateAttempt,
  ormDeleteAttempt,
  ormGetUserAttempts,
  ormIsDuplicateAttempt,
};
