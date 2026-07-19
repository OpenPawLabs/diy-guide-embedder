# diy-guide-embedder

A single, self-contained `<script>` that embeds `.mdx` DIY guides into any static
HTML page — no build step, no framework, no install. It pairs the
[`@openpawlabs/diy-guides-ui`](https://github.com/OpenPawLabs/diy-guides-ui-react)
components with the [authoring tool](https://github.com/OpenPawLabs/diy-guides-authoring-tool)
so anyone can publish a guide by committing files to a GitHub repository.

## Usage

Add one script tag and one element. The element renders wherever you place it:

```html
<diy-guide src="./guide/guide.mdx"></diy-guide>

<script
  src="https://openpawlabs.github.io/diy-guide-embedder/embed.js"
  defer
></script>
```

That's it. The embedder fetches the guide, compiles its MDX in the browser, and
renders it with the guide components. See
[`diy-guide-example`](https://github.com/OpenPawLabs/diy-guide-example) for a
complete, deployable page.

### The `src` attribute

`src` is resolved relative to the host page (just like an `<img src>`), so
`./guide/guide.mdx` points at a guide alongside your `index.html`. Absolute URLs
work too — including guides hosted on another origin, provided that origin sends
permissive CORS headers.

### Relative assets inside the guide

Asset paths written in the guide (`./images/...`, `./files/...` on `MediaFigure`,
`ToolList.Item`, and `LinkButton.Item`) are resolved against the **guide's** URL,
not the host page. So a guide and its `images/` folder can live in a subfolder and
still render correctly no matter which page embeds it. Absolute URLs, protocol-
relative URLs (`//…`), and `data:` URIs are passed through untouched.

### Faster image loads (optional)

The embedder does **not** resize images at runtime. If the guide host has run
`diy-guide-images` (from `@openpawlabs/diy-guides-ui`) before publishing, an
`images/thumbnails/variants.json` file will sit beside the guide; the embedder
loads it and the UI serves AVIF `srcset` automatically. Without that file, guides
still work — they just download the full canonical images. See
[`diy-guide-example`](https://github.com/OpenPawLabs/diy-guide-example) for a
Pages workflow that generates variants on deploy.

## How it works

```
fetch(src) → strip the diy-guides-ui import → rewrite relative asset URLs
→ compile MDX (@mdx-js/mdx) → render with @openpawlabs/diy-guides-ui
```

The library components are passed to the compiled guide via MDX's `components`
prop (the `import { … } from "@openpawlabs/diy-guides-ui"` line in a guide is
optional — it documents intent for the authoring tool and is stripped here). Asset
URLs are rewritten on the MDX **source** rather than by wrapping components,
because the components detect their children by referential identity; wrapping
would break galleries and bullet lists.

Everything — React, the guide components, HeroUI styles, generated Tailwind
utilities, the library component CSS, and the MDX compiler — is bundled into one
`embed.js`. The CSS is injected at runtime, so a single script tag is all an
author ever adds.

## Trust model

A guide's MDX is compiled and evaluated in the visitor's browser, which means it
can run JavaScript. Only embed guides you control or trust. Sandboxing untrusted,
third-party guides is **not** a goal of this project.

## Styling

The embedder owns its Tailwind build and scans the installed
`@openpawlabs/diy-guides-ui` package while bundling. These styles are global, so
the embedder is designed for pages where the guide is the main content. It is
not isolated in a Shadow DOM (which would break the image lightbox and other
overlays that render via portals).

## Development

```bash
pnpm install
pnpm dev       # dev harness at http://localhost:5173 (renders public/sample)
pnpm test      # Vitest (jsdom)
pnpm typecheck
pnpm lint
pnpm build     # → dist/embed.js (single self-contained script)
```

## License

[AGPL-3.0-or-later](LICENSE)
