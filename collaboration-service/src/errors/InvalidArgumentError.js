import BaseError from './BaseError.js';

class InvalidArgumentError extends BaseError {
  constructor(message) {
    super(500, message);
    this.name = 'InvalidArgumentError';
    this.statusCode = 403;
  }
}

export default InvalidArgumentError;
