export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Parse and normalise page/limit from query string.
 */
export function parsePagination(query: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 10), 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build the pagination meta object to attach to responses.
 */
export function buildPaginationMeta(
  total: number,
  { page, limit }: PaginationParams
): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
