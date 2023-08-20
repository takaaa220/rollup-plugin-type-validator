export const validateNumber = (value: unknown) => typeof value === "number";

export const validateString = (value: unknown) => typeof value === "string";

export const validateBoolean = (value: unknown) => typeof value === "boolean";

export const validateConst = (expected: unknown) => (value: unknown) =>
  value === expected;

export const validateOptional =
  (validator: (value: unknown) => boolean) => (value: unknown) =>
    value === undefined || validator(value);

export const validateUnion =
  (validators: ((value: unknown) => boolean)[]) => (value: unknown) =>
    validators.some((validator) => validator(value));

export const validateTuple =
  (validators: ((value: unknown) => boolean)[]) => (value: unknown) =>
    Array.isArray(value) &&
    value.length === validators.length &&
    validators.every((validator, i) => validator(value[i]));

export const validateArray =
  (validator: (value: unknown) => boolean) => (value: unknown) =>
    Array.isArray(value) && value.every(validator);

export const validateObject = (schema: object) => (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  Object.keys(value).every((key) => key in schema) &&
  Object.entries(schema).every(([key, validator]) =>
    validator((value as any)[key])
  );

export const noop = () => true;
