import BaseError from './BaseError.js';

class UserRegistrationError extends BaseError {
  constructor(message) {
    super(400, message);
    this.name = 'UserRegistrationError';
    this.statusCode = 400;
  }
}

export default UserRegistrationError;
