import axios from 'axios';
import BaseError from '../errors/BaseError.js';
import RoomCreationError from '../errors/RoomCreationError.js';
import RoomNotFoundError from '../errors/RoomNotFoundError.js';
import UserDeregistrationError from '../errors/UserDeregistrationError.js';
import UserNotFoundError from '../errors/UserNotFoundError.js';
import UserRegistrationError from '../errors/UserRegistrationError.js';
import LocalClient from './client.js';

// create the client and export it
// await RedisClient.deleteIfPresent();
// await RedisClient.createIfAbsent();

const createRoom = async (request, response, next) => {
  try {
    const users = request.body.users;
    const question = request.body.question;

    if (users === undefined || users === null || question === null || question === undefined) {
      throw new RoomCreationError(
        'Unable to create room as no users or questions are defined'
      );
    }

    const [roomId, isUsingDuplicateRoom] = LocalClient.createRoom(users);
    LocalClient.putQuestion(roomId, question);

    return response.status(200).json({
      statusCode: 200,
      data: {
        roomId: roomId,
        question: question,
      },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query: ${err}`)
    );
  }
};

const deleteRoom = (request, response, next) => {
  try {
    const { roomId } = request.query;
    LocalClient.deleteRoom(roomId);

    return response.status(200).json({
      statusCode: 200,
      data: {
        message: 'Deletion successful',
      },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query: ${err}`)
    );
  }
};

const getRoomDetails = async (request, response, next) => {
  try {
    const { roomId } = request.params;
    const users = LocalClient.getUserByDoc(roomId);
    console.log('users:', users);

    if (users === null) {
      throw new RoomNotFoundError('Room cannot be found');
    }

    return response.status(200).json({
      statusCode: 200,
      data: {
        [roomId]: {
          users: users,
        },
      },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query: ${err}`)
    );
  }
};

const getUserDetails = async (request, response, next) => {
  try {
    console.log(request.query);
    const { userId } = request.query;
    const roomDetails = LocalClient.getDocByUser(userId);

    if (roomDetails === null) {
      throw new UserNotFoundError('User ID is invalid');
    }

    return response.status(200).json({
      statusCode: 200,
      data: roomDetails,
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query: ${err}`)
    );
  }
};

const registerUser = async (request, response, next) => {
  try {
    const roomId = request.body.roomId;
    const userId = request.body.userId;

    if (
      roomId === undefined ||
      roomId === null ||
      userId === undefined ||
      userId === null
    ) {
      throw new UserRegistrationError(
        'Cannot register user as userId or roomId is missing'
      );
    }

    console.log('registering user in api.js:', userId, roomId);
    LocalClient.add(userId, roomId);

    // if user is registered to an empty room, we create a room ID and return it
    return response.status(200).json({
      statusCode: 200,
      data: {},
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query: ${err}`)
    );
  }
};

const deregisterUser = async (request, response, next) => {
  try {
    const roomId = request.body.roomId;
    const userId = request.body.userId;

    if (
      roomId === undefined ||
      roomId === null ||
      userId === undefined ||
      userId === null
    ) {
      throw new UserDeregistrationError(
        'Cannot register user as userId or roomId is missing'
      );
    }

    LocalClient.delete(userId, roomId);

    return response.status(200).json({
      statusCode: 200,
      data: {},
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query: ${err}`)
    );
  }
};

export {
  createRoom,
  getRoomDetails,
  getUserDetails,
  deleteRoom,
  registerUser,
  deregisterUser,
};