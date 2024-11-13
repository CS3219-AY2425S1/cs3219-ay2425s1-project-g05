import BaseError from './BaseError.js';

class UserRegistrationError extends BaseError {
  constructor(message) {
    super(401, message);
    this.name = 'UserRegistrationError';
    this.statusCode = 401;
  }
}

export default UserRegistrationError;
