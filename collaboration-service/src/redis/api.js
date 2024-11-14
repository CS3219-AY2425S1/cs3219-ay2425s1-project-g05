import BaseError from '../errors/BaseError.js';
import RoomCreationError from '../errors/RoomCreationError.js';
import RoomNotFoundError from '../errors/RoomNotFoundError.js';
import UserDeregistrationError from '../errors/UserDeregistrationError.js';
import UserNotFoundError from '../errors/UserNotFoundError.js';
import UserRegistrationError from '../errors/UserRegistrationError.js';
import RedisClient from './client.js';

// create the client and export it
const client = new RedisClient();
await RedisClient.deleteIfPresent();
await RedisClient.createIfAbsent();

const createRoom = async (request, response, next) => {
  try {
    const users = request.body.users;

    if (users === undefined || users === null) {
      throw new RoomCreationError(
        'Unable to create room as no users are defined'
      );
    }

    const roomId = await client.createRoom(users);

    return response.status(200).json({
      statusCode: 200,
      data: {
        roomId: roomId,
      },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query Redis: ${err}`)
    );
  }
};

const deleteRoom = async (request, response, next) => {
  try {
    const { roomId } = request.params;
    await client.deleteRoom(roomId);

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
        : new BaseError(500, `Unable to query Redis: ${err}`)
    );
  }
};

const getRoomDetails = async (request, response, next) => {
  try {
    const { roomId } = request.params;
    const users = await client.getUser(roomId);

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
        : new BaseError(500, `Unable to query Redis: ${err}`)
    );
  }
};

const getUserDetails = async (request, response, next) => {
  try {
    const { userId } = request.params;
    const roomDetails = await client.getRoom(userId);

    if (roomId === null) {
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
        : new BaseError(500, `Unable to query Redis: ${err}`)
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

    const registrationResult = await client.registerUser(roomId, userId);

    // if user is registered to existing room, we continue and send 200
    if (registrationResult === null) {
      return response.status(200).json({
        statusCode: 200,
        data: {},
      });
    }

    // if user is registered to an empty room, we create a room ID and return it
    return response.status(200).json({
      statusCode: 200,
      data: {
        roomId: registrationResult,
      },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query Redis: ${err}`)
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

    await client.deregisterUser(roomId, userId);

    return response.status(200).json({
      statusCode: 200,
      data: {},
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, `Unable to query Redis: ${err}`)
    );
  }
};

export {
  client,
  createRoom,
  getRoomDetails,
  getUserDetails,
  deleteRoom,
  registerUser,
  deregisterUser,
};
