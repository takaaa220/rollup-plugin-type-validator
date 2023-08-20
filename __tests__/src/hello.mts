import { initValidator } from "../../src/plugin/types.mjs";

type A<T> = T | undefined;

const validate = initValidator<{
  s: string;
  n: number;
  e?: "a" | "b";
  a: (string | number)[];
  ax: true;
  alias: A<string>;
}>();

export const hello = (value: unknown) => {
  const res = validate(value);
  return res;
};
