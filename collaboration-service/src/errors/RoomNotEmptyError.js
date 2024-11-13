import BaseError from './BaseError.js';

class RoomNotEmptyError extends BaseError {
  constructor(message) {
    super(401, message);
    this.name = 'RoomNotEmptyError';
    this.statusCode = 401;
  }
}

export default RoomNotEmptyError;
