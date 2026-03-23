
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
  
    // Mongoose CastError (ID không hợp lệ)
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
      const field = Object.keys(err.keyPattern)[0];
      message = `${field} đã tồn tại`;
    }
  
    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Token không hợp lệ';
    }
    if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token đã hết hạn';
    }
  
    // Multer Errors (nếu có upload file)
    if (err.name === 'MulterError') {
      statusCode = 400;
      message = `Lỗi upload file: ${err.message}`;
    }
  
    res.status(statusCode).json({
      message: message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });

  };

module.exports = { notFound, errorHandler };