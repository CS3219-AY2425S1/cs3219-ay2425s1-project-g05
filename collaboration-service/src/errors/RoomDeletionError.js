import BaseError from './BaseError.js';

class RoomDeletionError extends BaseError {
  constructor(message) {
    super(500, message);
    this.name = 'RoomDeletionError';
    this.statusCode = 500;
  }
}

export default RoomDeletionError;
