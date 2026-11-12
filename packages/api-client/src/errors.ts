export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | undefined;
  readonly validationErrors: string[] | undefined;

  constructor(init: { status: number; code: string; message: string; requestId?: string; validationErrors?: string[] }) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.validationErrors = init.validationErrors;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isNetwork() {
    return this.status === 0;
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;
