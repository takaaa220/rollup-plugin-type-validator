import { describe, expect, it } from "vitest";
import { ValidatorFunctions } from "../plugin/validator.mjs";
import {
  validateArray,
  validateBoolean,
  validateConst,
  validateNumber,
  validateObject,
  validateOptional,
  validateString,
  validateTuple,
  validateUnion,
} from "./index.mjs";

describe("export functions", () => {
  it("should export functions", async () => {
    const validatorFunctions = Object.keys(ValidatorFunctions);

    const exported = await import("./index.mjs");

    validatorFunctions.forEach((f) => {
      expect(f in exported, `${f} is not exported`).toBe(true);
    });
  });
});

describe("validator", () => {
  describe("validateNumber", () => {
    it.each([1, -1, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      "should return true if %d",
      (input) => {
        expect(validateNumber(input)).toBe(true);
      }
    );

    it.each(["1", "a", true, false, null, undefined])(
      "should return false if %s",
      (input) => {
        expect(validateNumber(input)).toBe(false);
      }
    );
  });

  describe("validateString", () => {
    it.each(["a", ""])("should return true if %s", (input) => {
      expect(validateString(input)).toBe(true);
    });

    it.each([1, true, false, null, undefined])(
      "should return false if %s",
      (input) => {
        expect(validateString(input)).toBe(false);
      }
    );
  });

  describe("validateBoolean", () => {
    it("should return true if boolean", () => {
      expect(validateBoolean(true)).toBe(true);
      expect(validateBoolean(false)).toBe(true);
    });

    it("should return false if not boolean", () => {
      expect(validateBoolean("true")).toBe(false);
      expect(validateBoolean(null)).toBe(false);
      expect(validateBoolean(1)).toBe(false);
    });
  });

  describe("validateConst", () => {
    it.each(["a", 3, true, null, undefined])(
      `should return true if value is %s`,
      (input) => {
        expect(validateConst(input)(input)).toBe(true);
      }
    );

    it(`should return false if value is not equal`, () => {
      expect(validateConst(3)(2)).toBe(false);
      expect(validateConst(3)("3")).toBe(false);
      expect(validateConst(true)(false)).toBe(false);
      expect(validateConst(true)("true")).toBe(false);
      expect(validateConst(null)(undefined)).toBe(false);
      expect(validateConst(null)("null")).toBe(false);
      expect(validateConst(undefined)("undefined")).toBe(false);
    });
  });

  describe("validateOptional", () => {
    it("valid", () => {
      expect(validateConst(undefined)(undefined)).toBe(true);
      expect(validateConst(undefined)(null)).toBe(false);
      expect(validateConst(undefined)(1)).toBe(false);
      expect(validateConst(undefined)("")).toBe(false);
      expect(validateConst(undefined)(true)).toBe(false);
      expect(validateConst(undefined)(false)).toBe(false);
    });
  });

  describe("validateUnion", () => {
    it.each([
      [validateUnion([validateConst("a"), validateConst("b")]), ["a", "b"]],
      [validateUnion([validateString, validateNumber]), ["3", 3]],
    ])("should return true if value is valid (Case%#)", (validator, inputs) => {
      expect(inputs.every(validator)).toBe(true);
    });

    it.each([
      [validateUnion([validateConst("a"), validateConst("b")]), [3, "c", null]],
      [
        validateUnion([validateString, validateNumber]),
        [true, null, undefined],
      ],
    ])(
      "should return false if value is invalid (Case%#)",
      (validator, inputs: any[]) => {
        expect(inputs.every((input) => !validator(input))).toBe(true);
      }
    );
  });

  describe("validateTuple", () => {
    it.each([
      [validateTuple([validateConst("a"), validateConst("b")]), ["a", "b"]],
      [
        validateTuple([
          validateString,
          validateNumber,
          validateConst(true),
          validateUnion([validateString, validateNumber]),
        ]),
        ["3", 3, true, "3"],
      ],
      [validateTuple([]), []],
    ])("should return true if value is valid (Case%#)", (validator, input) => {
      expect(validator(input)).toBe(true);
    });

    it.each([
      [validateTuple([validateBoolean]), ["true"]],
      [validateTuple([]), ["3"]],
    ])("should return false if value is valid (Case%#)", (validator, input) => {
      expect(validator(input)).toBe(false);
    });
  });

  describe("validateArray", () => {
    it.each([
      [validateArray(validateString), ["a", "b", "c"]],
      [validateArray(validateNumber), [1, 2, 3]],
      [validateArray(validateNumber), []],
      [
        validateArray(validateUnion([validateString, validateNumber])),
        ["a", 1, 3],
      ],
    ])("should return true if value is valid (Case%#)", (validator, input) => {
      expect(validator(input)).toBe(true);
    });

    it.each([
      [validateArray(validateString), [1, 2, 3]],
      [validateArray(validateNumber), ["1", "2"]],
      [validateArray(validateBoolean), ["true", undefined]],
    ])(
      "should return false if value is invalid (Case%#)",
      (validator, input) => {
        expect(validator(input)).toBe(false);
      }
    );
  });

  describe("validateObject", () => {
    it.each([
      [
        validateObject({
          a: validateString,
          b: validateNumber,
        }),
        { a: "a", b: 1 },
      ],
      [
        validateObject({
          a: validateOptional(validateString),
          b: validateNumber,
        }),
        { b: 1 },
      ],
      [
        validateObject({
          a: validateObject({
            aa: validateString,
            bb: validateBoolean,
            cc: validateTuple([
              validateString,
              validateNumber,
              validateConst(3),
            ]),
          }),
          b: validateNumber,
        }),
        { a: { aa: "2", bb: false, cc: ["1", 2, 3] }, b: 1 },
      ],
    ])("should return true if value is valid (Case%#)", (validator, input) => {
      expect(validator(input)).toBe(true);
    });

    it.each([
      [
        validateObject({
          a: validateString,
          b: validateNumber,
        }),
        { a: 2, b: "1" },
      ],
      [
        validateObject({
          a: validateOptional(validateString),
          b: validateNumber,
        }),
        {},
      ],
      [
        validateObject({
          a: validateOptional(validateString),
        }),
        { a: "a", b: 1 },
      ],
    ])(
      "should return false if value is invalid (Case%#)",
      (validator, input) => {
        expect(validator(input)).toBe(false);
      }
    );
  });
});
