import BaseError from './BaseError.js';

class UserAlreadyFoundInRoomError extends BaseError {
  constructor(message) {
    super(400, message);
    this.name = 'UserAlreadyFoundInRoomError';
    this.statusCode = 400;
  }
}

export default UserAlreadyFoundInRoomError;
