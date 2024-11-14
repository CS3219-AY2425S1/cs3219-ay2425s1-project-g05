import BaseError from './BaseError.js';
import UserRegistrationError from './UserRegistrationError.js';

class UserDeregistrationError extends UserRegistrationError {
  constructor(message) {
    super(400, message);
    this.name = 'UserDeregistrationError';
    this.statusCode = 400;
  }
}

export default UserDeregistrationError;
