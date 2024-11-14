import BaseError from './BaseError.js';

class RoomNotEmptyError extends BaseError {
  constructor(message) {
    super(400, message);
    this.name = 'RoomNotEmptyError';
    this.statusCode = 400;
  }
}

export default RoomNotEmptyError;
