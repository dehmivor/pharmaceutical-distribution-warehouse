/**
 * Middleware xử lý lỗi trung tâm
 * @param {Error} err - Lỗi được phát hiện
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi server';

  // Xử lý các loại lỗi khác nhau
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Không tìm thấy tài nguyên với id: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = `Trùng lặp giá trị cho trường ${Object.keys(err.keyPattern).join(', ')}`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn';
  }

  // Ghi log lỗi trong môi trường development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Gửi response lỗi
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
