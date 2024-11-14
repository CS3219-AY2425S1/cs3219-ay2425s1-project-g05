import BaseError from './BaseError.js';

class ForbiddenError extends BaseError {
  constructor(message) {
    super(400, message);
    this.name = 'ForbiddenError';
    this.statusCode = 400;
  }
}

export default ForbiddenError;
