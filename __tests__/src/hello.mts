import { initValidator } from "../../src/types.mjs";

const validate = initValidator<{
  s: string;
  n: number;
  e?: "a" | "b";
  a: (string | number)[];
  ax: true;
}>();

export const hello = (value: unknown) => {
  const res = validate(value);
  return res;
};
