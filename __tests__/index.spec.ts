import { rollup } from "rollup";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import typeGenerator from "../src/plugin/index.mjs";
import typescript from "rollup-plugin-typescript2";
import alias from "@rollup/plugin-alias";
import { unlinkSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("integrations", () => {
  describe("test1", () => {
    const generatedFilePath = join(__dirname, "generated.mjs");
    let mainFunc: any;

    beforeAll(async () => {
      const res = await rollup({
        input: join(__dirname, "src/index.mts"),
        plugins: [
          typeGenerator(),
          alias({
            entries: [
              {
                find: "rollup-plugin-type-validator/runtime",
                replacement: join(__dirname, "../src/runtime/index.mts"),
              },
            ],
          }),
          typescript(),
        ],
      });

      await res.write({
        format: "esm",
        file: generatedFilePath,
      });

      const { main } = await import(generatedFilePath);
      mainFunc = main;
    });

    afterAll(() => {
      unlinkSync(generatedFilePath);
    });

    it.each([
      {
        s: "a",
        n: 2,
        e: "a",
        a: ["a", 1],
        ax: true,
        alias: "hello",
      },
      {
        s: "",
        n: 0,
        a: [],
        ax: true,
        alias: undefined,
      },
    ])("ok: %j", (input) => {
      const res = mainFunc(input);

      expect(res.ok).toBe(true);
      expect(res.value).toEqual(input);
    });

    it.each([
      {
        s: 100,
        n: 2,
        e: "a",
        a: ["a", 1],
        ax: true,
        alias: "hello",
      },
      {
        s: "sss",
        n: 1,
        a: [true],
        ax: false,
        alias: undefined,
      },
    ])("ng: %j", (input) => {
      const res = mainFunc(input);

      expect(res.ok).toBe(false);
      expect(res.value).toBe(undefined);
      expect(res.error).toBeInstanceOf(Error);
    });
  });
});
