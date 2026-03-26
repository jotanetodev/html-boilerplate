import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import chokidar from "chokidar";
import postcss from "postcss";
import postcssScssSyntax from "postcss-scss";
import { compileString as sassCompileString } from "sass";

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const rawArgs = argv.slice(2);
  const positional = [];
  const loadPaths = [];
  let watch = false;
  let style = "expanded";

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--watch" || arg === "-w") {
      watch = true;
      continue;
    }

    if (arg === "--style" && rawArgs[index + 1]) {
      style = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--style=")) {
      style = arg.slice("--style=".length);
      continue;
    }

    if ((arg === "--load-path" || arg === "-I") && rawArgs[index + 1]) {
      loadPaths.push(path.resolve(rawArgs[index + 1]));
      index += 1;
      continue;
    }

    if (arg.startsWith("--load-path=")) {
      loadPaths.push(path.resolve(arg.slice("--load-path=".length)));
      continue;
    }

    if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  const shouldDelegate = rawArgs.some((arg) =>
    [
      "--help",
      "-h",
      "--version",
      "--interactive",
      "--stdin",
      "--update",
      "--indented",
      "--indented-syntax",
    ].includes(arg)
  );

  if (shouldDelegate) {
    return {
      mode: "delegate",
      rawArgs,
    };
  }

  let inFileRaw;
  let outFileRaw;

  if (positional.length === 1 && positional[0].includes(":")) {
    [inFileRaw, outFileRaw] = positional[0].split(":", 2);
  } else if (positional.length >= 2) {
    [inFileRaw, outFileRaw] = positional;
  }

  if (!inFileRaw || !outFileRaw || positional.length > 2) {
    return {
      mode: "delegate",
      rawArgs,
    };
  }

  return {
    mode: "custom",
    inFile: path.resolve(inFileRaw),
    outFile: path.resolve(outFileRaw),
    loadPaths,
    rawArgs,
    style,
    watch,
  };
}

function runSassCli(rawArgs) {
  const sassCliPath = path.join(process.cwd(), "node_modules", "sass", "sass.js");

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [sassCliPath, ...rawArgs], {
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      process.exitCode = code ?? 0;
      resolve();
    });
  });
}

// ─── Sass path resolution (Sass partial convention: _file.scss) ──────────────

function resolveScssPath(importPath, fromDir, loadPaths = []) {
  const ext = path.extname(importPath);
  const base = path.basename(importPath, ext);
  const searchDirs = [fromDir, ...loadPaths].map((dirPath) =>
    path.resolve(dirPath, path.dirname(importPath))
  );

  for (const dir of searchDirs) {
    const candidates = ext
      ? [path.join(dir, `${base}${ext}`), path.join(dir, `_${base}${ext}`)]
      : [
        path.join(dir, `${base}.scss`),
        path.join(dir, `${base}.sass`),
        path.join(dir, `_${base}.scss`),
        path.join(dir, `_${base}.sass`),
        path.join(dir, base, "_index.scss"),
        path.join(dir, base, "_index.sass"),
      ];

    const resolved = candidates.find(existsSync);

    if (resolved) {
      return resolved;
    }
  }

  return null;
}

// ─── Dependency discovery ─────────────────────────────────────────────────────

function getDependencySpecifiers(content) {
  const re = /^\s*@(?:use|import|forward)\s+['"]([^'"]+)['"]/gm;
  const specifiers = [];
  let m;

  while ((m = re.exec(content)) !== null) {
    const rawPath = m[1];

    if (/^sass:|^https?:\/\/|\.css$/.test(rawPath)) {
      continue;
    }

    specifiers.push(rawPath);
  }

  return specifiers;
}

async function discoverDependencyFiles(entryFile, loadPaths) {
  const visited = new Set();
  const files = [];

  async function visit(filePath, includeSelf) {
    const normalizedPath = path.resolve(filePath);

    if (visited.has(normalizedPath)) {
      return;
    }

    visited.add(normalizedPath);

    const content = await readFile(normalizedPath, "utf8");
    const fromDir = path.dirname(normalizedPath);

    for (const specifier of getDependencySpecifiers(content)) {
      const resolved = resolveScssPath(specifier, fromDir, loadPaths);

      if (!resolved) {
        continue;
      }

      await visit(resolved, true);
    }

    if (includeSelf) {
      files.push(normalizedPath);
    }
  }

  await visit(entryFile, false);

  return files;
}

// ─── Sass evaluation helpers ──────────────────────────────────────────────────

const SENTINEL_RULE = "__preserve_css_resolve__";
const SENTINEL_PROP = "--__preserve_css_value__";
const SCOPE_SELECTOR = ".__preserve_css_scope__";

function getSassContextStatements(content) {
  const statements = [];
  const re = /^\s*@(?:use|forward|import)\s+[^;]+;/gm;
  let m;

  while ((m = re.exec(content)) !== null) {
    statements.push(m[0].trim());
  }

  return statements;
}

function parseCssFragment(css) {
  return postcss.parse(css);
}

function restoreScopedSelectors(selector) {
  return selector.replaceAll(SCOPE_SELECTOR, "&");
}

function nodesFrom(node) {
  return (node.nodes ?? []).map((child) => child.clone());
}

function filterScopedNodes(nodes) {
  const output = [];

  for (const node of nodes) {
    if (node.type === "rule") {
      const selectors = node.selectors ?? [node.selector];

      if (selectors.some((selector) => selector.includes(SCOPE_SELECTOR))) {
        output.push(node);
        continue;
      }
    }

    if (node.nodes?.length) {
      const filteredChildren = filterScopedNodes(nodesFrom(node));

      if (filteredChildren.length > 0) {
        node.removeAll();
        node.append(filteredChildren);
        output.push(node);
      }
    }
  }

  return output;
}

function unwrapScopedNodes(nodes) {
  const output = [];

  for (const node of nodes) {
    if (node.type === "rule") {
      const selectors = node.selectors ?? [node.selector];
      const restoredSelectors = selectors.map((selector) =>
        restoreScopedSelectors(selector)
      );
      const isScopeOnly = restoredSelectors.every((selector) => selector === "&");

      if (isScopeOnly) {
        output.push(...unwrapScopedNodes(nodesFrom(node)));
        continue;
      }

      node.selector = restoredSelectors.join(", ");
    }

    if (node.nodes?.length) {
      const unwrappedChildren = unwrapScopedNodes(nodesFrom(node));
      node.removeAll();
      node.append(unwrappedChildren);
    }

    output.push(node);
  }

  return output;
}

function extractScopedNodes(css) {
  const root = parseCssFragment(css);
  return unwrapScopedNodes(filterScopedNodes(nodesFrom(root)));
}

function compileSassSnippet(source, options) {
  return sassCompileString(source, {
    loadPaths: options.loadPaths,
    style: "expanded",
    sourceMap: false,
  }).css;
}

function compileDependencyCss(contextStatements, options) {
  if (contextStatements.length === 0) {
    return "";
  }

  return compileSassSnippet(contextStatements.join("\n"), options).trim();
}

function evalSassExpr(expr, useStatements, options) {
  const VARNAME = "__preserve_css_result__";
  const testSrc = [
    ...useStatements,
    `$${VARNAME}: ${expr};`,
    `.${SENTINEL_RULE} { ${SENTINEL_PROP}: #{$${VARNAME}}; }`,
  ].join("\n");

  try {
    const compiled = compileSassSnippet(testSrc, options);
    const m = new RegExp(`${SENTINEL_PROP}:\\s*([^;\\n]+);`).exec(compiled);
    return m ? m[1].trim() : expr;
  } catch {
    return expr;
  }
}

function resolveSassValue(value, useStatements, options) {
  let result = value;

  result = result.replace(/#\{([^}]+)\}/g, (_match, inner) => {
    const resolved = evalSassExpr(inner, useStatements, options);
    return resolved !== inner ? resolved : inner;
  });

  result = result.replace(/([a-z][\w-]*\.[a-z][\w-]*\([^()]*\))/g, (match) =>
    evalSassExpr(match, useStatements, options)
  );

  return result;
}

function isSassOnlyAtRule(node) {
  return (
    node.type === "atrule" &&
    [
      "use",
      "import",
      "forward",
      "mixin",
      "function",
      "include",
      "if",
      "else",
      "for",
      "each",
      "while",
      "debug",
      "warn",
      "error",
      "return",
      "extend",
      "at-root",
    ].includes(node.name)
  );
}

function canPreserveStructure(node) {
  return (
    node.type === "rule" ||
    (node.type === "atrule" && !isSassOnlyAtRule(node))
  );
}

function compileScopedStatement(node, contextStatements, options) {
  const source = [
    ...contextStatements,
    `${SCOPE_SELECTOR} {`,
    node.toString(),
    `}`,
  ].join("\n");

  try {
    return extractScopedNodes(compileSassSnippet(source, options));
  } catch {
    return [node.clone()];
  }
}

function applyReplacementFormatting(originalNode, replacementNodes) {
  const baseBefore = originalNode.raws.before ?? "\n";
  const indent = baseBefore.includes("\n")
    ? baseBefore.slice(baseBefore.lastIndexOf("\n") + 1)
    : "";
  const closingBefore = `\n${indent}`;

  for (let index = 0; index < replacementNodes.length; index += 1) {
    const replacementNode = replacementNodes[index];

    replacementNode.raws = {
      ...replacementNode.raws,
      before: index === 0 ? baseBefore : baseBefore,
    };

    if (replacementNode.nodes?.length) {
      replacementNode.raws.after = closingBefore;
    }
  }
}

function ensureTrailingSemicolons(container) {
  for (const node of container.nodes ?? []) {
    if (node.nodes?.length) {
      ensureTrailingSemicolons(node);

      if (node.nodes.some((child) => child.type === "decl")) {
        node.raws.semicolon = true;
      }
    }
  }
}

// ─── Transform entry SCSS: preserve nesting/& and compile Sass-only parts ────

function transformEntry(content, options) {
  const contextStatements = getSassContextStatements(content);

  const root = postcssScssSyntax.parse(content);

  function visit(container) {
    for (const node of [...(container.nodes ?? [])]) {
      if (node.type === "comment" && node.raws.inline) {
        node.remove();
        continue;
      }

      if (node.type === "decl" && node.prop.startsWith("$")) {
        node.remove();
        continue;
      }

      if (node.type === "decl") {
        node.value = resolveSassValue(node.value, contextStatements, options);
        continue;
      }

      if (node.type === "atrule" && ["use", "import", "forward", "mixin", "function"].includes(node.name)) {
        node.remove();
        continue;
      }

      if (node.type === "atrule" && isSassOnlyAtRule(node)) {
        const replacementNodes = compileScopedStatement(
          node,
          contextStatements,
          options
        );

        applyReplacementFormatting(node, replacementNodes);

        for (const replacementNode of replacementNodes.reverse()) {
          node.after(replacementNode);
        }

        node.remove();
        continue;
      }

      if (canPreserveStructure(node) && node.nodes?.length) {
        visit(node);
      }
    }
  }

  visit(root);
  ensureTrailingSemicolons(root);

  return postcss()
    .process(root, { syntax: postcssScssSyntax })
    .css.trim();
}

// ─── Build ────────────────────────────────────────────────────────────────────

async function buildCss(inFile, outFile, buildOptions) {
  const srcDir = path.dirname(inFile);
  const content = await readFile(inFile, "utf8");
  const loadPaths = [srcDir, ...buildOptions.loadPaths];
  const contextStatements = getSassContextStatements(content);
  const dependencyCss = compileDependencyCss(contextStatements, {
    ...buildOptions,
    loadPaths,
  });
  const entryCss = transformEntry(content, {
    ...buildOptions,
    loadPaths,
  });

  let outputCss = [dependencyCss, entryCss].filter(Boolean).join("\n\n") + "\n";

  if (buildOptions.style === "compressed") {
    outputCss = outputCss
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s*{\s*/g, "{")
      .replace(/\s*}\s*/g, "}")
      .replace(/\s*;\s*/g, ";")
      .replace(/\s*,\s*/g, ",")
      .replace(/\s+/g, " ")
      .replace(/;}/g, "}")
      .trim();

    if (!outputCss.endsWith("\n")) {
      outputCss += "\n";
    }
  }

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, outputCss, "utf8");

  console.log(
    `[preserve-css] wrote ${path.relative(process.cwd(), outFile)}`
  );
}

// ─── Watch ────────────────────────────────────────────────────────────────────

async function runWatch(inFile, outFile, options) {
  await buildCss(inFile, outFile, options);

  const loadPaths = [path.dirname(inFile), ...options.loadPaths];
  let dependencyFiles = await discoverDependencyFiles(inFile, loadPaths);

  const watcher = chokidar.watch([inFile, ...dependencyFiles], {
    ignoreInitial: true,
  });

  watcher.on("all", async (eventName, changedPath) => {
    if (![".scss", ".sass"].includes(path.extname(changedPath))) return;

    try {
      await buildCss(inFile, outFile, options);
      dependencyFiles = await discoverDependencyFiles(inFile, loadPaths);
      watcher.add([inFile, ...dependencyFiles]);
      console.log(
        `[preserve-css] rebuilt after ${eventName}: ${path.relative(process.cwd(), changedPath)}`
      );
    } catch (error) {
      console.error("[preserve-css] build failed");
      console.error(error);
    }
  });

  const relDir = path.relative(process.cwd(), path.dirname(inFile));
  console.log(`[preserve-css] watching ${relDir} for .scss changes`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const parsedArgs = parseArgs(process.argv);

if (parsedArgs.mode === "delegate") {
  runSassCli(parsedArgs.rawArgs).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else if (parsedArgs.watch) {
  runWatch(parsedArgs.inFile, parsedArgs.outFile, parsedArgs).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  buildCss(parsedArgs.inFile, parsedArgs.outFile, parsedArgs).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
