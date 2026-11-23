export interface AppErrorDetails {
  issues?: Record<string, string[] | undefined>;
}

export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly details?: AppErrorDetails,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos", details?: AppErrorDetails) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Não encontrado") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito") {
    super(message, 409);
  }
}
