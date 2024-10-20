import BaseError from "./BaseError.js";

class BadRequestError extends BaseError {
  constructor(message) {
    super(400, message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
  }
}

export default BadRequestError;