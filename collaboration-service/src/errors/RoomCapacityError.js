import BaseError from './BaseError.js';

class RoomCapacityError extends BaseError {
  constructor(message) {
    super(401, message);
    this.name = 'RoomCapacityError';
    this.statusCode = 401;
  }
}

export default RoomCapacityError;
