import BaseError from "./BaseError.js";

class UnauthorisedError extends BaseError {
  constructor(message) {
    super(401, message);
    this.name = "UnauthorisedError";
    this.statusCode = 401;
  }
}

export default UnauthorisedError;