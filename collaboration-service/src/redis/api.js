import BaseError from '../errors/BaseError.js';
import InvalidQueryParamError from '../errors/InvalidQueryParamError.js';
import RoomNotFoundError from '../errors/RoomNotFoundError.js';
import UserNotFoundError from '../errors/UserNotFoundError.js';
import RedisClient from './client.js';

const client = new RedisClient();
client.deleteIfPresent();
client.createIfAbsent();

const createRoom = async (request, response, next) => {
  try {
    const users = request.body.users ?? [];

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
    const { roomId } = request.query;
    const users = await client.findUsersFromRoom(roomId);

    if (users === null) {
      throw new RoomNotFoundError('Room cannot be found');
    }

    return response.status(200).json({
      statusCode: 200,
      data: {
        roomId: roomId,
        users: users,
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
    const { userId } = request.query;
    const roomId = await client.findRoomByUser(userId);

    if (roomId === null) {
      throw new UserNotFoundError('User ID is invalid');
    }

    return response.status(200).json({
      statusCode: 200,
      data: {
        userId: userId,
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

const registerUser = async (request, response, next) => {
  try {
    const { roomId, userId } = request.query;
    await client.registerUser(roomId, userId);
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
    const { roomId, userId } = request.query;
    await client.deregisterUser(roomId, userId);
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
