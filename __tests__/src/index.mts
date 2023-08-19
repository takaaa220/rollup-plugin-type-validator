import { hello } from "./hello.mjs";

export function main(v: unknown) {
  const res = hello(v);

  return res;
}
