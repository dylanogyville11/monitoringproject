import { Response } from 'express';

/**
 * Send a standardized success response.
 */
export function successResponse(
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200,
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a standardized error response.
 */
export function errorResponse(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown,
): Response {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
}
