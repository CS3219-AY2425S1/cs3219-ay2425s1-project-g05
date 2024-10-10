const loggingMiddleware = (req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    next();
  };
  
  export default loggingMiddleware;
  