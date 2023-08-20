export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

export type Validator<T> = (value: unknown) => ValidationError<T>;

export declare function initValidator<T>(): Validator<T>;
