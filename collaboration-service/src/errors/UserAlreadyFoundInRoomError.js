import BaseError from './BaseError.js';

class UserAlreadyFoundInRoomError extends BaseError {
  constructor(message) {
    super(401, message);
    this.name = 'UserAlreadyFoundInRoomError';
    this.statusCode = 401;
  }
}

export default UserAlreadyFoundInRoomError;
