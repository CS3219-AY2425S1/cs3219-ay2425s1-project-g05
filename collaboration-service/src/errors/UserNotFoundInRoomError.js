import BaseError from './BaseError.js';

class UserNotFoundInRoomError extends BaseError {
  constructor(message) {
    super(404, message);
    this.name = 'UserNotFoundInRoomError';
    this.statusCode = 404;
  }
}

export default UserNotFoundInRoomError;
