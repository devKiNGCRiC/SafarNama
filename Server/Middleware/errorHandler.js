import AppError from '../utils/AppError.js';

const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return new AppError(`Duplicate ${field}. Please use another value!`, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const handleMulterError = (err) => {
  const message =
    err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong!',
  });
};

const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Known library errors are converted in every environment so clients get a
  // 4xx with a useful message instead of a 500.
  let error = err;
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  else if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  else if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  else if (err.name === 'JsonWebTokenError') error = handleJWTError();
  else if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  else if (err.name === 'MulterError') error = handleMulterError(err);

  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Anything that is not explicitly "production" is treated as development.
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.DEV_MODE === 'production';

  return isProduction ? sendErrorProd(error, res) : sendErrorDev(error, res);
};

export default globalErrorHandler;
