type Data = {
  [key: string]: any;
  accessTokenExpired?: boolean;
  refreshTokenExpired?: boolean;
  signOut?: boolean;
};

class AppError extends Error {
  public readonly statusCode: number;
  public readonly data?: Data;

  constructor(statusCode: number, message: string, data: Data = {}) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace
    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
