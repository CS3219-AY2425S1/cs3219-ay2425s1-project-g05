import BaseError from './BaseError.js';

class RoomNotEmptyError extends BaseError {
  constructor(message) {
    super(403, message);
    this.name = 'RoomNotEmptyError';
    this.statusCode = 403;
  }
}

export default RoomNotEmptyError;
