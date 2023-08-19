import { createFilter } from "@rollup/pluginutils";
import { PluginImpl } from "rollup";
import { Project, SyntaxKind, Type } from "ts-morph";
import { createValidateFunctions, createValidator } from "./validator.mjs";

const createTypeValidator: PluginImpl<{
  include?: string;
  exclude?: string;
}> = (options = {}) => {
  const filter = createFilter(options.include, options.exclude);
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { isolatedModules: true, strict: true },
  });

  const TS_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts"];
  let addedValidateFunctions = false;

  return {
    name: "rollup-plugin-type-validator",
    buildStart: () => {},
    transform(source, id) {
      if (!TS_EXTENSIONS.some((ext) => id.endsWith(ext)) || !filter(id)) {
        return null;
      }

      const sourceFile = project.createSourceFile(id, source);
      let hasValidator = false;

      sourceFile.forEachDescendant((node) => {
        if (node.getKind() === SyntaxKind.CallExpression) {
          const callExpr = node.asKind(SyntaxKind.CallExpression);
          if (callExpr?.getExpression().getText() === "initValidator") {
            hasValidator = true;
            const typeNode = callExpr.getTypeArguments()[0];
            if (!typeNode) {
              throw new Error("Missing type argument for initValidator");
            }

            callExpr.replaceWithText(
              `(value: unknown) => ${createValidator(
                typeNode.getType()
              )}(value) ? { ok: true, value } : { ok: false, error: new Error('failed validation')}`
            );
          }
        }
      });

      if (!hasValidator) return null;

      const transformed = addedValidateFunctions
        ? sourceFile.getFullText()
        : `${createValidateFunctions()}\n${sourceFile.getFullText()}`;

      return {
        code: transformed,
        map: { mappings: "" }, // This is a simplified approach. For better source map support, consider integrating a library.
      };
    },
  };
};

export default createTypeValidator;
