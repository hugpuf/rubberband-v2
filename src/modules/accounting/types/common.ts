
// Common types used across multiple modules

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generic paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
