import { createFilter } from "@rollup/pluginutils";
import { PluginImpl } from "rollup";
import { Project, SyntaxKind } from "ts-morph";
import MagicString from "magic-string";
import { createValidator, createValidatorImports } from "./validator.mjs";

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

            callExpr.replaceWithText(createValidator(typeNode.getType()));
          }
        }
      });

      if (!hasValidator) return null;

      sourceFile.addImportDeclaration(createValidatorImports());

      // TODO: refactor
      const magicString = new MagicString(source);
      const transformed = sourceFile.getFullText();
      magicString.overwrite(0, source.length, transformed);

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true }),
      };
    },
  };
};

export default createTypeValidator;
