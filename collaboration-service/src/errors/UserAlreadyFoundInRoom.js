import BaseError from './BaseError.js';

class UserAlreadyFoundInRoom extends BaseError {
  constructor(message) {
    super(404, message);
    this.name = 'UserAlreadyFoundInRoom';
    this.statusCode = 404;
  }
}

export default UserAlreadyFoundInRoom;
