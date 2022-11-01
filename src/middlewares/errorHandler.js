import { CustomAPIError } from "../utils/customError.js";

const errorResponse = (res, statusCode, msg) =>
  res.status(statusCode).json({ message: msg, success: 0 });

const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof CustomAPIError) {
    return errorResponse(res, err.statusCode, err.message);
  } else if (err.name === "ValidationError") {
    let msg = "";
    Object.keys(err.errors).forEach((key) => {
      msg += err.errors[key].message + ".";
    });

    return errorResponse(res, 400, msg);
  } else if (err.name === "TokenExpiredError") {
    return errorResponse(res, 401, "Not authorized: token expired");
  }
  console.log(err);
  return errorResponse(res, 500, "Something went wrong, please try again");
};

export default errorHandlerMiddleware;
