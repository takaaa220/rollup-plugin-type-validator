import { describe, expect, it } from "vitest";
import { Project } from "ts-morph";
import { createValidatorInner } from "./validator.mjs";

describe.todo("createValidator", () => {});

describe("createValidatorInner", () => {
  it.each([
    [
      `{ s: string; e: "a" | "b"; n: number; a: (string | number)[]; }`,
      `validateObject({ s: validateString, e: validateUnion([validateConst("a"), validateConst("b")]), n: validateNumber, a: validateArray(validateUnion([validateString, validateNumber])) })`,
    ],
    [
      `{ s?: string }`,
      `validateObject({ s: validateOptional(validateUnion([validateConst(undefined), validateString])) })`,
    ],
    [
      `{ s: string | null }`,
      `validateObject({ s: validateUnion([validateConst(null), validateString]) })`,
    ],
    [
      `["a", "c", 1 | 2 | 3]`,
      `validateTuple([validateConst("a"), validateConst("c"), validateUnion([validateConst(3), validateConst(1), validateConst(2)])])`,
    ],
    [
      `{ a: string } & { b: string }`,
      `validateIntersection([validateObject({ a: validateString }), validateObject({ b: validateString })])`,
    ],
    [
      `string & { _: "T" }`,
      `validateIntersection([validateString, validateObject({ _: validateConst("T") })])`,
    ],
  ])("%s", (input, expected) => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: { isolatedModules: true, strict: true },
    });
    const sourceFile = project.createSourceFile("temp.ts", "");

    const typeLiteralNode = sourceFile
      .addTypeAlias({
        name: "TempType",
        type: input,
      })
      .getTypeNodeOrThrow();

    const res = createValidatorInner(typeLiteralNode.getType());
    expect(res).toBe(expected);
  });
});
