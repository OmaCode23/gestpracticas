const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const [entry, ...args] = process.argv.slice(2);

if (!entry) {
  console.error("Usage: node scripts/run-ts.cjs <entry.ts> [...args]");
  process.exit(1);
}

function registerTsExtension(extension) {
  require.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename, "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });

    module._compile(outputText, filename);
  };
}

registerTsExtension(".ts");
registerTsExtension(".tsx");

const resolvedEntry = path.resolve(projectRoot, entry);
process.argv = [process.argv[0], resolvedEntry, ...args];
require(resolvedEntry);
