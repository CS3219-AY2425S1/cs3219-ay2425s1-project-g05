import BadRequestError from "../errors/BadRequestError.js";
import BaseError from "../errors/BaseError.js";
import ConflictError from "../errors/ConflictError.js";
import NotFoundError from "../errors/NotFoundError.js";
import UnauthorisedError from "../errors/UnauthorisedError.js";
import {
  ormCreateAttempt,
  ormGetAttempt,
  ormIsDuplicateAttempt,
  ormUpdateAttempt,
  ormDeleteAttempt,
  ormGetUserAttempts,
} from "../models/orm.js";

const createAttempt = async (req, res, next) => {
  console.log("createAttempt");
  const userId = req.userId;
  const attempt = req.body;

  try {
    // check for duplicate attempt
    if (!userId) {
      throw new UnauthorisedError("No user found");
    }
    if (
      await ormIsDuplicateAttempt(userId, attempt.otherUserId, attempt.roomId)
    ) {
      throw new ConflictError("Attempt already exists");
    }
    const newAttemptWithId = { ...attempt, userId };
    const newAttempt = await ormCreateAttempt(newAttemptWithId);
    return res
      .status(201)
      .json({ statusCode: 201, data: { attempt: newAttempt } });
  } catch (err) {
    console.log(err);
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, "Error creating the question")
    );
  }
};

const getAttempt = async (req, res, next) => {
  const userId = req.userId;
  const { roomId } = req.params;

  try {
    if (!userId || !roomId) {
      throw new BadRequestError("userId and roomId are required");
    }

    const attempt = await ormGetAttempt(userId, roomId);
    // NO EXISTING ATTEMPT TO GET
    if (attempt.length === 0) {
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
  const userId = req.userId;
  const { roomId } = req.params;
  const attempt = req.body;

  try {
    // VALIDATE - ATTEMPT SHOULD ONLY HAVE NOTES
    // ALLOW EMPTY STRING AS NOTES
    if (Object.keys(attempt).length !== 1 || !("notes" in attempt)) {
      throw new BadRequestError("Only notes can be updated");
    }

    console.log(userId, roomId);
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
  const userId = req.userId;
  const { roomId } = req.params;

  try {
    if (!userId || !roomId) {
      throw new BadRequestError("userId and roomId are required");
    }
    console.log(userId, roomId);
    // NO EXISTING ATTEMPT TO DELETE
    const existingAttempt = await ormGetAttempt(userId, roomId);
    if (existingAttempt.length === 0) {
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
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorisedError("No user found, no attempts to get.");
    }

    const attempts = await ormGetUserAttempts(userId);
    // NO EXISTING ATTEMPT BY USER
    if (attempts.length === 0) {
      return res.status(200).json({ statusCode: 204, data: { attempts: [] } });
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
