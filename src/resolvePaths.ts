import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

/** JSX attributes whose string values are guide-relative asset URLs. */
const URL_ATTRIBUTES = new Set(["src", "href", "thumbnail", "poster", "heroImage"]);

/**
 * Build a resolver that turns a guide-relative asset path into an absolute URL.
 *
 * Guides are fetched over HTTP, so relative paths like `./images/foo.jpg` must
 * resolve against the guide's URL — not the host page. Values that are already
 * absolute (`http(s):`, protocol-relative `//`, or `data:`) are returned
 * untouched so external links and inline data URIs pass through.
 */
export function resolveAgainst(base: string): (value: string) => string {
  return (value) => (isAbsolute(value) ? value : new URL(value, base).href);
}

/**
 * Rewrite guide-relative asset URLs in MDX source to absolute URLs.
 *
 * Resolution happens on the source (not via component wrappers) so the real
 * `@openpawlabs/diy-guides-ui` components can be passed through unchanged —
 * `GuideStep` and friends rely on referential identity of their children, which
 * any wrapper would break. The MDX is parsed to an AST so only JSX attribute
 * values are touched; markdown and fenced code (e.g. example snippets) are left
 * exactly as authored. Edits are spliced back by source offset, so formatting is
 * otherwise preserved byte-for-byte.
 */
export function rewriteAssetUrls(source: string, base: string): string {
  const resolve = resolveAgainst(base);
  const tree = unified().use(remarkParse).use(remarkMdx).parse(source) as MdxNode;
  const edits: Edit[] = [];

  collectAttributeEdits(tree, resolve, edits);

  // Apply back-to-front so earlier offsets stay valid.
  edits.sort((a, b) => b.start - a.start);
  let output = source;
  for (const edit of edits) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }

  return output;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

interface MdxAttribute {
  type: string;
  name?: string;
  value?: unknown;
  position?: { start: { offset: number }; end: { offset: number } };
}

interface MdxNode {
  type: string;
  children?: MdxNode[];
  attributes?: MdxAttribute[];
}

function collectAttributeEdits(
  node: MdxNode,
  resolve: (value: string) => string,
  edits: Edit[],
): void {
  for (const attribute of node.attributes ?? []) {
    if (
      attribute.type !== "mdxJsxAttribute" ||
      !attribute.name ||
      !URL_ATTRIBUTES.has(attribute.name) ||
      typeof attribute.value !== "string" ||
      !attribute.position
    ) {
      continue;
    }

    const resolved = resolve(attribute.value);
    if (resolved === attribute.value) {
      continue;
    }

    edits.push({
      start: attribute.position.start.offset,
      end: attribute.position.end.offset,
      text: `${attribute.name}="${resolved.replaceAll('"', "%22")}"`,
    });
  }

  for (const child of node.children ?? []) {
    collectAttributeEdits(child, resolve, edits);
  }
}

function isAbsolute(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//");
}
