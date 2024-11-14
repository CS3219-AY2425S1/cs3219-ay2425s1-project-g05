import BaseError from './BaseError.js';

class RoomCapacityError extends BaseError {
  constructor(message) {
    super(400, message);
    this.name = 'RoomCapacityError';
    this.statusCode = 400;
  }
}

export default RoomCapacityError;
