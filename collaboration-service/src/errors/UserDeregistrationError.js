import BaseError from './BaseError.js';
import UserRegistrationError from './UserRegistrationError.js';

class UserDeregistrationError extends UserRegistrationError {
  constructor(message) {
    super(401, message);
    this.name = 'UserDeregistrationError';
    this.statusCode = 401;
  }
}

export default UserDeregistrationError;
