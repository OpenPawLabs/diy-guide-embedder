import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ELEMENT_NAME, registerDiyGuideElement } from "../element";

registerDiyGuideElement();

const GUIDE_SOURCE = `import { GuideLayout, GuideStep, GuideStepList, MediaFigure } from "@openpawlabs/diy-guides-ui";

<GuideLayout>
  <GuideLayout.Header title="Mounted guide" difficulty="easy" timeEstimate="5 minutes" />
  <GuideLayout.Intro>Hello from the embedder.</GuideLayout.Intro>
  <GuideLayout.Content>
    <GuideStepList>
      <GuideStep title="Look at this">
        <GuideStep.Media>
          <MediaFigure src="./images/photo.jpg" />
        </GuideStep.Media>
        <GuideStep.Bullets>
          <GuideStep.Bullet>A real composed step.</GuideStep.Bullet>
        </GuideStep.Bullets>
      </GuideStep>
    </GuideStepList>
  </GuideLayout.Content>
</GuideLayout>`;

function mockFetch(response: Partial<Response> & { text?: () => Promise<string> }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, ...response })),
  );
}

async function mount(attributes: Record<string, string>): Promise<HTMLElement> {
  const element = document.createElement(ELEMENT_NAME);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("diy-guide element", () => {
  it("registers the custom element", () => {
    expect(customElements.get(ELEMENT_NAME)).toBeTypeOf("function");
  });

  it("fetches, compiles, and renders the guide", async () => {
    mockFetch({ text: async () => GUIDE_SOURCE });

    await mount({ src: "./guide/guide.mdx" });

    await waitFor(() =>
      expect(document.body.textContent).toContain("Mounted guide"),
    );

    // The full GuideStep composed (real components, identity preserved) and the
    // relative image resolved against the guide URL — not the host page.
    const guideUrl = new URL("./guide/guide.mdx", document.baseURI).href;
    expect(globalThis.fetch).toHaveBeenCalledWith(guideUrl);
    await waitFor(() => {
      const image = document.body.querySelector("img");
      expect(image?.getAttribute("src")).toBe(
        new URL("./images/photo.jpg", guideUrl).href,
      );
    });
  });

  it("shows an error when the guide cannot be fetched", async () => {
    mockFetch({ ok: false, status: 404, text: async () => "" });

    await mount({ src: "./missing.mdx" });

    await waitFor(() =>
      expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
        "HTTP 404",
      ),
    );
  });

  it("shows an error when src is missing", async () => {
    await mount({});

    await waitFor(() =>
      expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
        "src",
      ),
    );
  });
});
