import { describe, expect, it } from "vitest";
import { resolveAgainst, rewriteAssetUrls } from "../resolvePaths";

const BASE = "https://example.github.io/my-guide/guide.mdx";

describe("resolveAgainst", () => {
  const resolve = resolveAgainst(BASE);

  it("resolves relative paths against the guide URL", () => {
    expect(resolve("./images/a.jpg")).toBe(
      "https://example.github.io/my-guide/images/a.jpg",
    );
    expect(resolve("../shared/b.png")).toBe(
      "https://example.github.io/shared/b.png",
    );
  });

  it("leaves absolute, protocol-relative, and data URLs untouched", () => {
    expect(resolve("https://cdn.example.com/x.png")).toBe(
      "https://cdn.example.com/x.png",
    );
    expect(resolve("//cdn.example.com/x.png")).toBe("//cdn.example.com/x.png");
    expect(resolve("data:image/png;base64,AAAA")).toBe(
      "data:image/png;base64,AAAA",
    );
  });
});

describe("rewriteAssetUrls", () => {
  it("rewrites relative JSX asset attributes to absolute URLs", () => {
    const source = `<MediaFigure src="./images/a.jpg" />
<ToolList.Item name="Kit" thumbnail="./images/kit.png" href="https://shop.example/kit" />
<LinkButton.Item href="./files/firmware.zip">Download</LinkButton.Item>`;

    const output = rewriteAssetUrls(source, BASE);

    expect(output).toContain(
      'src="https://example.github.io/my-guide/images/a.jpg"',
    );
    expect(output).toContain(
      'thumbnail="https://example.github.io/my-guide/images/kit.png"',
    );
    expect(output).toContain(
      'href="https://example.github.io/my-guide/files/firmware.zip"',
    );
    // Absolute href is preserved.
    expect(output).toContain('href="https://shop.example/kit"');
  });

  it("rewrites heroImage on GuideLayout.Header to an absolute URL", () => {
    const source = `<GuideLayout>
  <GuideLayout.Header
    title="Overview Guide"
    heroImage="./images/trackers-with-dock-wip-1.png"
    heroImageAlt="Trackers on a dock"
  />
</GuideLayout>`;

    const output = rewriteAssetUrls(source, BASE);

    expect(output).toContain(
      'heroImage="https://example.github.io/my-guide/images/trackers-with-dock-wip-1.png"',
    );
    expect(output).toContain('heroImageAlt="Trackers on a dock"');
  });

  it("leaves relative paths inside fenced code blocks untouched", () => {
    const source = [
      "Add the embed tag:",
      "",
      "```html",
      '<diy-guide src="./guide/guide.mdx"></diy-guide>',
      "```",
    ].join("\n");

    const output = rewriteAssetUrls(source, BASE);

    expect(output).toBe(source);
  });
});
