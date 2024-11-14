import BaseError from "./BaseError.js";

class ServiceUnavailableError extends BaseError {
  constructor(message) {
    super(503, message);
    this.name = 'ServiceUnavailableError';
    this.statusCode = 503;
  }
}

export default ServiceUnavailableError;