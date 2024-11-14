import BaseError from './BaseError.js';

class JsonParseError extends BaseError {
  constructor(message) {
    super(500, message);
    this.name = 'JsonParseError';
    this.statusCode = 500;
  }
}

export default JsonParseError;
