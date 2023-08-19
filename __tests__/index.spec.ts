import { rollup } from "rollup";
import { describe, it } from "vitest";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import typeGenerator from "../src/index.mjs";
import typescript from "rollup-plugin-typescript2";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("integrations", () => {
  it("test", async () => {
    const res = await rollup({
      input: join(__dirname, "src/index.mts"),
      output: {
        format: "esm",
      },
      plugins: [typeGenerator(), typescript()],
    });

    console.log("hello world");

    const { output } = await res.generate({ format: "esm" });

    console.log(output[0].code);
    // TODO: write assertions
  });
});
