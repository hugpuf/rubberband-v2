
/**
 * Base entity interface with common properties for all entities
 */
export interface BaseEntity {
  createdAt: string;
  updatedAt: string;
}

/**
 * Common pagination response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
