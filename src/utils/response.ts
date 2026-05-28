import { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export const sendSuccess = (
  res: Response,
  message: string,
  data: unknown = {},
  pagination?: Pagination
) => {
  res.json({
    success: true,
    message,
    data,
    pagination: pagination ?? { page: 1, limit: 10, total: Array.isArray(data) ? (data as any[]).length : 0 },
  });
};

export const sendError = (
  res: Response,
  status: number,
  message: string,
  errors: Record<string, unknown> = {}
) => {
  res.status(status).json({
    success: false,
    message,
    errors,
  });
};
