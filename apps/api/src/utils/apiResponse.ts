export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: ApiErrorDetail[];

  constructor(code: string, message: string, statusCode: number, details?: ApiErrorDetail[]) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON(): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export function errorResponse(code: string, message: string, statusCode: number, details?: ApiErrorDetail[]): ApiError {
  return new ApiError(code, message, statusCode, details);
}
