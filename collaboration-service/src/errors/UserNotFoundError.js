import BaseError from './BaseError.js';

class UserNotFoundError extends BaseError {
  constructor(message) {
    super(404, message);
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}

export default UserNotFoundError;
