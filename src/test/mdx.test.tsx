import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { compileGuide, formatMdxError, stripGuideUiImports } from "../mdx";

describe("stripGuideUiImports", () => {
  it("removes the guide UI import and preserves other imports", () => {
    const source = `import value from "./local";
import {
  GuideLayout,
  MediaFigure,
} from "@openpawlabs/diy-guides-ui";

<GuideLayout />`;

    const stripped = stripGuideUiImports(source);

    expect(stripped).toContain('import value from "./local";');
    expect(stripped).not.toContain("@openpawlabs/diy-guides-ui");
    expect(stripped).toContain("<GuideLayout />");
  });
});

describe("compileGuide", () => {
  it("renders member components from the provided scope", async () => {
    const GuideLayout = Object.assign(
      ({ children }: { children?: ReactNode }) => <section>{children}</section>,
      { Header: ({ title }: { title: string }) => <h1>{title}</h1> },
    );

    const Content = await compileGuide(
      'import { GuideLayout } from "@openpawlabs/diy-guides-ui";\n\n<GuideLayout><GuideLayout.Header title="Scoped title" /></GuideLayout>',
    );

    render(<Content components={{ GuideLayout }} />);

    expect(screen.getByRole("heading", { name: "Scoped title" })).toBeTruthy();
  });
});

describe("formatMdxError", () => {
  it("formats MDX compile errors", async () => {
    await expect(
      compileGuide("<GuideLayout").catch((error) => formatMdxError(error)),
    ).resolves.toContain("Unexpected end of file");
  });
});
