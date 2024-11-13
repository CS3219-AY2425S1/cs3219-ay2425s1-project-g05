import BaseError from './BaseError.js';

class InvalidQueryParamError extends BaseError {
  constructor(message) {
    super(401, message);
    this.name = 'InvalidQueryParamError';
    this.statusCode = 401;
  }
}

export default InvalidQueryParamError;
