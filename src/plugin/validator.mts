import { OptionalKind, Type, ImportDeclarationStructure } from "ts-morph";

export const ValidatorFunctions = {
  validateNumber: "validateNumber",
  validateString: "validateString",
  validateBoolean: "validateBoolean",
  validateConst: (v: string) => `validateConst(${v})`,
  validateOptional: (v: string) => `validateOptional(${v})`,
  validateUnion: (v: string[]) => `validateUnion([${v.join(", ")}])`,
  validateIntersection: (v: string[]) =>
    `validateIntersection([${v.join(", ")}])`,
  validateTuple: (v: string[]) => `validateTuple([${v.join(", ")}])`,
  validateArray: (v: string) => `validateArray(${v})`,
  validateObject: (v: { key: string; value: string }[]) =>
    `validateObject({ ${v
      .map((item) => `${item.key}: ${item.value}`)
      .join(", ")} })`,
  noop: "noop",
} as const;

export function createValidator(type: Type): string {
  return `(value: unknown) => ${createValidatorInner(
    type
  )}(value) ? { ok: true, value } : { ok: false, error: new Error('failed validation')}`;
}

export function createValidatorInner(type: Type): string {
  if (type.isLiteral()) return ValidatorFunctions.validateConst(type.getText());
  if (type.isNull()) return ValidatorFunctions.validateConst("null");
  if (type.isUndefined()) return ValidatorFunctions.validateConst("undefined");

  if (type.isAny() || type.isUnknown()) return ValidatorFunctions.noop;

  if (type.isString()) return ValidatorFunctions.validateString;
  if (type.isNumber()) return ValidatorFunctions.validateNumber;
  if (type.isBoolean()) return ValidatorFunctions.validateBoolean;

  if (type.isUnion()) {
    return ValidatorFunctions.validateUnion(
      type.getUnionTypes().map(createValidatorInner)
    );
  }

  if (type.isIntersection()) {
    return ValidatorFunctions.validateIntersection(
      type.getIntersectionTypes().map(createValidatorInner)
    );
  }

  if (type.isTuple()) {
    return ValidatorFunctions.validateTuple(
      type.getTupleElements().map(createValidatorInner)
    );
  }

  if (type.isArray()) {
    return ValidatorFunctions.validateArray(
      createValidatorInner(type.getArrayElementTypeOrThrow())
    );
  }

  if (type.isObject()) {
    const validations = type.getProperties().map((prop) => {
      const validator = createValidatorInner(
        prop.getValueDeclarationOrThrow().getType()
      );

      return {
        key: prop.getName(),
        value: prop.isOptional()
          ? ValidatorFunctions.validateOptional(validator)
          : validator,
      };
    });

    return ValidatorFunctions.validateObject(validations);
  }

  throw new Error("not implemented");
}

export function createValidatorImports(): OptionalKind<ImportDeclarationStructure> {
  return {
    moduleSpecifier: "rollup-plugin-type-validator/runtime",
    namedImports: Object.keys(ValidatorFunctions),
  };
}
