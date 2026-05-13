const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
const errorHandler = (err, req, res, next) => {
    let statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
    let message = err.message;

    // Mongoose CastError (invalid ID)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      statusCode = 404;
      message = 'Resource not found';
    }

    // Mongoose ValidationError
    if (err.name === 'ValidationError') {
      statusCode = 400;
      const errors = Object.values(err.errors).map(e => e.message);
      message = errors.join(', ');
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
      statusCode = 400;
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      message = `Duplicate value: ${field} already exists`;
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token has expired';
    }

    // Multer Errors (if file upload is used)
    if (err.name === 'MulterError') {
      statusCode = 400;
      message = `File upload error: ${err.message}`;
    }

    const payload = { message };
    if (process.env.NODE_ENV !== 'production') {
      payload.stack = err.stack;
    }

    res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };
