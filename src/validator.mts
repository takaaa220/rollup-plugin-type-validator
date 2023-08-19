import { Type } from "ts-morph";

export const ValidatorFunctions = {
  number: "validateNumber",
  string: "validateString",
  boolean: "validateBoolean",
  const: (v: string) => `validateConst(${v})`,
  optional: (v: string) => `validateOptional(${v})`,
  union: (v: string[]) => `validateUnion([${v.join(", ")}])`,
  tuple: (v: string[]) => `validateTuple([${v.join(", ")}])`,
  array: (v: string) => `validateArray(${v})`,
  object: (v: { key: string; value: string }[]) =>
    `validateObject({ ${v
      .map((item) => `${item.key}: ${item.value}`)
      .join(", ")} })`,
  noop: "noop",
};

export function createValidator(type: Type): string {
  if (type.isLiteral()) return ValidatorFunctions.const(type.getText());
  if (type.isNull()) return ValidatorFunctions.const("null");
  if (type.isUndefined()) return ValidatorFunctions.const("undefined");

  if (type.isAny() || type.isUnknown()) return ValidatorFunctions.noop;

  if (type.isString()) return ValidatorFunctions.string;
  if (type.isNumber()) return ValidatorFunctions.number;
  if (type.isBoolean()) return ValidatorFunctions.boolean;

  if (type.isUnion()) {
    return ValidatorFunctions.union(type.getUnionTypes().map(createValidator));
  }

  if (type.isTuple()) {
    return ValidatorFunctions.tuple(
      type.getTupleElements().map(createValidator)
    );
  }

  if (type.isArray()) {
    return ValidatorFunctions.array(
      createValidator(type.getArrayElementTypeOrThrow())
    );
  }

  if (type.isObject()) {
    const validations = type.getProperties().map((prop) => {
      const validator = createValidator(
        prop.getValueDeclarationOrThrow().getType()
      );

      return {
        key: prop.getName(),
        value: prop.isOptional()
          ? ValidatorFunctions.optional(validator)
          : validator,
      };
    });

    return ValidatorFunctions.object(validations);
  }

  throw new Error("not implemented");
}

export function createValidateFunctions(): string {
  // TODO: refactor
  const validators = [
    "const validateNumber = (value: unknown) => typeof value === 'number';",
    "const validateString = (value: unknown) => typeof value === 'string';",
    "const validateBoolean = (value: unknown) => typeof value === 'boolean';",
    "const validateConst = (expected: unknown) => (value: unknown) => value === expected;",
    "const validateOptional = (validator: (value: unknown) => boolean) => (value: unknown) => value === undefined || validator(value);",
    "const validateUnion = (validators: ((value: unknown) => boolean)[]) => (value: unknown) => validators.some((validator) => validator(value));",
    "const validateTuple = (validators: ((value: unknown) => boolean)[]) => (value: unknown) => Array.isArray(value) && validators.every((validator, i) => validator(value[i]));",
    "const validateArray = (validator: (value: unknown) => boolean) => (value: unknown) => Array.isArray(value) && value.every(validator);",
    "const validateObject = (schema: object) => (value: unknown) => typeof value === 'object' && value !== null && Object.entries(schema).every(([key, validator]) => validator((value as any)[key]));",
    "const noop = () => true;",
  ];

  return validators.join("\n");
}
