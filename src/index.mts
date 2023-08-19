import { createFilter } from "@rollup/pluginutils";
import { PluginImpl } from "rollup";
import { Project, SyntaxKind, Type } from "ts-morph";

function getBasicValidator(type: Type): string {
  switch (type.getText()) {
    case "number":
      return "_validateNumber";
    case "string":
      return "_validateString";
    case "boolean":
      return "_validateBoolean";
    default:
      return "";
  }
}

const createTypeValidator: PluginImpl<{
  include?: string;
  exclude?: string;
}> = (options = {}) => {
  const filter = createFilter(options.include, options.exclude);
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { isolatedModules: true },
  });
  const addedValidators = new Set<string>();

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

            const type = typeNode.getType();
            callExpr.replaceWithText(
              "(value: unknown) => Math.random() > 0.5 ? { ok: true, value } : { ok: false, error: new Error('error') }"
            );

            // // 基本型の場合
            // const basicValidator = getBasicValidator(type);
            // if (basicValidator) {
            //   callExpr.replaceWithText(
            //     `(${basicValidator}(value) ? { ok: true, value } : { ok: false, error: new Error('Type mismatch. Expected ${type.getText()}') })`
            //   );
            //   addedValidators.add(basicValidator);
            //   return;
            // }

            // // オブジェクト型の場合
            // if (type.isObject()) {
            //   const properties = type.getProperties();
            //   const validations = properties
            //     .map((prop) => {
            //       const propName = prop.getName();
            //       const propType = prop.getValueDeclaration()?.getType();
            //       const propValidator = propType && getBasicValidator(propType);
            //       if (propValidator) {
            //         addedValidators.add(propValidator);
            //         return `${propValidator}(value.${propName})`;
            //       }
            //       return `typeof value.${propName} === '${propType?.getText()}'`;
            //     })
            //     .join(" && ");

            //   callExpr.replaceWithText(
            //     `((typeof value === 'object' && value !== null && ${validations}) ? { ok: true, value } : { ok: false, error: new Error('Type mismatch. Expected ${type.getText()}') })`
            //   );
            // }
          }
        }
      });

      if (!hasValidator) return null;

      return {
        code: sourceFile.getFullText(),
        map: { mappings: "" }, // This is a simplified approach. For better source map support, consider integrating a library.
      };
    },
    outputOptions(outputOptions) {
      const validators: string[] = [];
      for (const validator of addedValidators) {
        switch (validator) {
          case "_validateNumber":
            validators.push(
              'function _validateNumber(value: unknown): value is number { return typeof value === "number"; }'
            );
            break;
          case "_validateString":
            validators.push(
              'function _validateString(value: unknown): value is string { return typeof value === "string"; }'
            );
            break;
          // ... 他の基本型も同様に追加してください
        }
      }

      if (validators.length) {
        return {
          ...outputOptions,
          intro: validators.join("\n") + (outputOptions.intro || ""),
        };
      }

      return null;
    },
  };
};

export default createTypeValidator;
