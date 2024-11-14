import BaseError from './BaseError.js';

class UsersAlreadyFoundError extends BaseError {
  constructor(message) {
    super(409, message);
    this.name = 'UsersAlreadyFoundError';
    this.statusCode = 409;
  }
}

export default UsersAlreadyFoundError;
