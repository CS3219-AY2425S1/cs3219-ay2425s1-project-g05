import BaseError from "./BaseError.js";

class ConflictError extends BaseError {
  constructor(message) {
    super(409, message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

export default ConflictError;