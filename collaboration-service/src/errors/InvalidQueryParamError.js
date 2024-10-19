import BaseError from './BaseError.js';

class InvalidQueryParamError extends BaseError {
  constructor(message) {
    super(403, message);
    this.name = 'InvalidQueryParamError';
    this.statusCode = 403;
  }
}

export default InvalidQueryParamError;
