import { useEffect, useState, type CSSProperties } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  GUIDE_IMAGE_VARIANTS_PATH,
  GuideImageVariantsProvider,
  type GuideImageVariantsManifest,
} from "@openpawlabs/diy-guides-ui";
import { guideComponents } from "./components";
import { compileGuide, formatMdxError, type GuideMdxComponent } from "./mdx";
import { rewriteAssetUrls } from "./resolvePaths";

/** The custom element tag authors place on their page. */
export const ELEMENT_NAME = "diy-guide";

type LoadState =
  | { status: "loading" }
  | {
      status: "ready";
      Content: GuideMdxComponent;
      variants: GuideImageVariantsManifest | null;
    }
  | { status: "error"; message: string };

async function loadVariantsManifest(
  guideUrl: string,
): Promise<GuideImageVariantsManifest | null> {
  try {
    const response = await fetch(new URL(GUIDE_IMAGE_VARIANTS_PATH, guideUrl).href);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as GuideImageVariantsManifest;
  } catch {
    return null;
  }
}

/** Fetches, compiles, and renders a single guide; shows loading/error inline. */
function GuideMount({ url }: { url: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Could not load guide (HTTP ${response.status}) from ${url}`,
          );
        }
        const source = await response.text();
        const [Content, variants] = await Promise.all([
          compileGuide(rewriteAssetUrls(source, url), url),
          loadVariantsManifest(url),
        ]);
        if (!cancelled) {
          setState({ status: "ready", Content, variants });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: "error", message: formatMdxError(error) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.status === "loading") {
    return <Notice>Loading guide…</Notice>;
  }

  if (state.status === "error") {
    return <Notice tone="error">{state.message}</Notice>;
  }

  const { Content, variants } = state;
  return (
    <GuideImageVariantsProvider manifest={variants}>
      <Content components={guideComponents} />
    </GuideImageVariantsProvider>
  );
}

const noticeBase: CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "0.5rem",
  font: "0.95rem/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
};

function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error";
}) {
  const style: CSSProperties =
    tone === "error"
      ? { ...noticeBase, background: "#fef2f2", color: "#991b1b" }
      : { ...noticeBase, background: "#f1f5f9", color: "#475569" };
  return (
    <div role={tone === "error" ? "alert" : "status"} style={style}>
      {children}
    </div>
  );
}

/**
 * `<diy-guide src="./guide/guide.mdx">` — fetches the guide relative to the host
 * page, compiles its MDX in the browser, and renders it with the
 * `@openpawlabs/diy-guides-ui` components. Custom elements upgrade regardless of
 * script/element ordering, so no manual DOM scanning is needed.
 */
export class DiyGuideElement extends HTMLElement {
  static observedAttributes = ["src"];
  private root: Root | null = null;

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.root) {
      this.render();
    }
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = null;
  }

  private render() {
    this.root ??= createRoot(this);
    const src = this.getAttribute("src");

    if (!src) {
      this.root.render(
        <Notice tone="error">
          {`<${ELEMENT_NAME}> needs a "src" attribute pointing to your guide's .mdx file.`}
        </Notice>,
      );
      return;
    }

    let url: string;
    try {
      url = new URL(src, document.baseURI).href;
    } catch {
      this.root.render(<Notice tone="error">{`Invalid guide src: ${src}`}</Notice>);
      return;
    }

    // Key by url so changing src remounts with fresh loading state.
    this.root.render(<GuideMount key={url} url={url} />);
  }
}

/** Register the custom element. Safe to call more than once. */
export function registerDiyGuideElement(): void {
  if (!customElements.get(ELEMENT_NAME)) {
    customElements.define(ELEMENT_NAME, DiyGuideElement);
  }
}
