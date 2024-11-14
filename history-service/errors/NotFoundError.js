import BaseError from "./BaseError.js";

class NotFoundError extends BaseError {
  constructor(message) {
    super(404, message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export default NotFoundError;