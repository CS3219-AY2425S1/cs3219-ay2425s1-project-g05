import BaseError from './BaseError.js';

class UserNotFoundInRoom extends BaseError {
  constructor(message) {
    super(404, message);
    this.name = 'UserNotFoundInRoom';
    this.statusCode = 404;
  }
}

export default UserNotFoundInRoom;
