import BaseError from './BaseError.js';

class RoomNotFoundError extends BaseError {
  constructor(message) {
    super(404, message);
    this.name = 'RoomNotFoundError';
    this.statusCode = 404;
  }
}

export default RoomNotFoundError;
