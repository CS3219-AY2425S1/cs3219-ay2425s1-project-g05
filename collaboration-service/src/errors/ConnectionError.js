import BaseError from './BaseError.js';

class ConnectionError extends BaseError {
  constructor(message) {
    super(500, message);
    this.name = 'ConnectionError';
    this.statusCode = 500;
  }
}

export default ConnectionError;
