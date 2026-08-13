export type ApiResponse<T> = {
  success: boolean;
  count?: number;
  message?: string;
  data: T;
};