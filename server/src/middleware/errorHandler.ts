import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      message: 'Validation failed.',
      issues: error.issues
    });
    return;
  }

  if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({ message: 'A record with the same unique value already exists.' });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: 'Internal server error.'
  });
};
