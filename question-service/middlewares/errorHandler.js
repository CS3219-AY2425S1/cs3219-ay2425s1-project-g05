const errorHandler = (err, req, res, next) => {

  const errStatus = err.statusCode || 500;
  const errMsg = err.message || "Internal Server Error";

  console.log(`Error ${errStatus}: ${errMsg}`);

  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMsg
  });
};

export default errorHandler;
