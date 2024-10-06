import BadRequestError from "../../question-service/errors/BadRequestError.js";
import BaseError from "../../question-service/errors/BaseError.js";
import ConflictError from "../../question-service/errors/ConflictError.js";
import NotFoundError from "../../question-service/errors/NotFoundError.js";
import {
  ormCreateAttempt,
  ormGetAttempt,
  ormIsDuplicateAttempt,
  ormUpdateAttempt,
  ormDeleteAttempt,
  ormGetUserAttempts,
} from "../models/orm.js";

const createAttempt = async (req, res, next) => {
  const attempt = req.body;

  try {
    // check for duplicate attempt
    if (
      ormIsDuplicateAttempt(
        attempt.userId,
        attempt.otherUserId,
        attempt.questionId,
        attempt.roomId
      )
    ) {
      throw new ConflictError("Attempt already exists");
    }
    const newAttempt = await ormCreateAttempt(attempt);
    return res
      .status(201)
      .json({ statusCode: 201, data: { attempt: newAttempt } });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error creating the question")
    );
  }
};

const getAttempt = async (req, res, next) => {
  const { userId, roomId } = req.query;
  console.log(userId, roomId);

  try {
    if (!userId || !roomId) {
      throw new BadRequestError("userId and roomId are required");
    }

    const attempt = await ormGetAttempt(userId, roomId);
    // NO EXISTING ATTEMPT TO GET
    if (!attempt) {
      throw new NotFoundError("Attempt not found");
    }
    return res.status(200).json({ statusCode: 200, data: { attempt } });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error getting the attempt")
    );
  }
};

const updateAttempt = async (req, res, next) => {
  const { userId, roomId } = req.params;
  const attempt = req.body;

  try {
    // VALIDATE - ATTEMPT SHOULD ONLY HAVE NOTES
    if (Object.keys(attempt).length !== 1 || !attempt.notes) {
      throw new BadRequestError("Only notes can be updated");
    }

    if (!userId || !roomId) {
      throw new BadRequestError("userId and roomId are required");
    }

    // NO EXISTING ATTEMPT TO UPDATE
    const existingAttempt = await ormGetAttempt(userId, roomId);
    if (!existingAttempt) {
      throw new NotFoundError("Attempt not found");
    }
    const updatedAttempt = await ormUpdateAttempt(userId, roomId, attempt);
    return res.status(200).json({
      statusCode: 200,
      message: "Attempt updated successfully",
      data: { attempt: updatedAttempt },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error updating attempt")
    );
  }
};

const deleteAttempt = async (req, res, next) => {
  const { userId, roomId } = req.params;
  console.log(userId, roomId);

  if (!userId || !roomId) {
    throw new BadRequestError("userId and roomId are required");
  }

  try {
    // NO EXISTING ATTEMPT TO DELETE
    const existingAttempt = await ormGetAttempt(userId, roomId);
    if (!existingAttempt) {
      throw new NotFoundError("Attempt not found");
    }

    const deletedAttempt = await ormDeleteAttempt(userId, roomId);
    return res.status(200).json({
      statusCode: 200,
      message: "Attempt deleted successfully",
      data: { attempt: deletedAttempt },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error deleting attempt")
    );
  }
};

const getUserAttempts = async (req, res, next) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      throw new BadRequestError("userId is required");
    }

    const attempts = await ormGetUserAttempts(userId);

    // NO EXISTING ATTEMPT BY USER
    if (attempts.length === 0) {
      throw new NotFoundError("No attempts found");
    }
    return res.status(200).json({ statusCode: 200, data: { attempts } });
  } catch (error) {
    next(
      error instanceof BaseError
        ? error
        : new BaseError(500, "Error getting attempts of user")
    );
  }
};

export {
  createAttempt,
  getAttempt,
  updateAttempt,
  deleteAttempt,
  getUserAttempts,
};
