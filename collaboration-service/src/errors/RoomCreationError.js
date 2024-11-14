import BaseError from './BaseError.js';

class RoomCreationError extends BaseError {
  constructor(message) {
    super(500, message);
    this.name = 'RoomCreationError';
    this.statusCode = 500;
  }
}

export default RoomCreationError;
