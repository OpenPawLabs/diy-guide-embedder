import { evaluate } from "@mdx-js/mdx";
import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

const GUIDE_UI_PACKAGE = "@openpawlabs/diy-guides-ui";

export type GuideMdxComponent = ComponentType<{
  components?: Record<string, unknown>;
}>;

/**
 * Compile a guide's MDX source into a React component. The
 * `@openpawlabs/diy-guides-ui` import is stripped because the guide components
 * are supplied at render time via the `components` prop instead of being
 * resolved as bare module specifiers (which the browser cannot load).
 *
 * `baseUrl` (the guide's URL) is where any surviving relative imports would
 * resolve from; it defaults to the document base.
 */
export async function compileGuide(
  source: string,
  baseUrl: string = typeof document === "undefined"
    ? "https://localhost/"
    : document.baseURI,
): Promise<GuideMdxComponent> {
  const module = await evaluate(stripGuideUiImports(source), {
    ...runtime,
    baseUrl,
  });

  return module.default as GuideMdxComponent;
}

/** Turn an unknown MDX/compile error into a readable single-line message. */
export function formatMdxError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      reason?: string;
      message?: string;
      line?: number;
      column?: number;
    };
    const message = candidate.reason ?? candidate.message;

    if (message) {
      if (candidate.line && candidate.column) {
        return `${message} (${candidate.line}:${candidate.column})`;
      }

      return message;
    }
  }

  return "The guide could not be compiled.";
}

export function stripGuideUiImports(source: string): string {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  const kept: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!isImportStart(line)) {
      kept.push(line);
      continue;
    }

    const statement = [line];
    while (!isCompleteImport(statement.join("\n")) && index < lines.length - 1) {
      index += 1;
      statement.push(lines[index]);
    }

    if (!importsGuideUi(statement.join("\n"))) {
      kept.push(...statement);
    }
  }

  return kept.join(newline).trimStart();
}

function isImportStart(line: string): boolean {
  return /^import(?:\s|[{*])/.test(line.trimStart());
}

function isCompleteImport(statement: string): boolean {
  return (
    /^\s*import\s+["'][^"']+["']\s*;?\s*$/.test(statement) ||
    /\sfrom\s+["'][^"']+["']\s*;?\s*$/.test(statement)
  );
}

function importsGuideUi(statement: string): boolean {
  return new RegExp(`\\sfrom\\s+["']${escapeRegExp(GUIDE_UI_PACKAGE)}["']`).test(
    statement,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
