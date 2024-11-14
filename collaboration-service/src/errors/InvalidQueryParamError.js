import BaseError from './BaseError.js';

class InvalidQueryParamError extends BaseError {
  constructor(message) {
    super(400, message);
    this.name = 'InvalidQueryParamError';
    this.statusCode = 400;
  }
}

export default InvalidQueryParamError;
