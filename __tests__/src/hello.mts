import { initValidator } from "../../src/types.mjs";

const validate = initValidator<{ s: string; n: number }>();

export const hello = (value: unknown) => {
  const res = validate(value);
  if (res.ok) {
    return "ok";
  }
  return "no";
};
