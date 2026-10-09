export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function requireObject(body: unknown, label = 'Body'): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, `${label} must be a JSON object.`);
  }
  return body as Record<string, unknown>;
}

export function optionalString(body: Record<string, unknown>, key: string, max = 20_000): string | undefined {
  const value = body[key];
  if (value == null) return undefined;
  if (typeof value !== 'string') throw new HttpError(400, `${key} must be a string.`);
  if (value.length > max) throw new HttpError(413, `${key} exceeds ${max} characters.`);
  return value;
}

export function requireString(body: Record<string, unknown>, key: string, max = 20_000): string {
  const value = optionalString(body, key, max);
  if (!value || !value.trim()) throw new HttpError(400, `${key} is required.`);
  return value;
}

export function assertPromptBudget(body: Record<string, unknown>, keys: string[], max = 80_000): void {
  const size = keys.reduce((sum, key) => sum + (typeof body[key] === 'string' ? (body[key] as string).length : 0), 0);
  if (size > max) throw new HttpError(413, 'Prompt payload is too large.');
}
