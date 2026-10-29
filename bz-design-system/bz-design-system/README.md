# Basmeh & Zeitooneh design system

Built from the BZ Brand Guidelines PDF, with missing values measured on basmeh-zeitooneh.org (2026-09-29).

## What's inside

- `brand-book.md`: the rules. Name, tone of voice, colour, type, layout, logo and imagery. Read this first.
- `tokens.json`: every colour (light and dark), type style, spacing, radius and layout size, each with a usage note.
- `tokens.css`: the same tokens as CSS variables (`var(--burgundy)`, `var(--space-6)` ...) plus type classes (`.title`, `.heading`, `.body` ...). Dark theme: add `data-theme="dark"` to `<html>`.
- `assets/logos/`: six vector logos (horizontal, vertical, mark; colour and white).
- `assets/imagery/`: two reference photos for logo-on-photo placement.
- `components/`: React components (Button, Logo, SectionRail, Note, TextField) under `window.BZ`, with `bundle.css`, `bundle.js`, TypeScript types and a usage note per component.
- `example.html`: a working page that uses all of it. Open it in a browser.

## Quick start (plain HTML)

```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components/bundle.css">
<h1 class="title" style="color:var(--heading)">Basmeh &amp; Zeitooneh</h1>
<p class="body">Founded by refugees, for refugees.</p>
<button class="bz-btn bz-btn-primary">View programs</button>
```

## Quick start (React)

Load React 18 (copies included in `vendor/`), then `components/bundle.js`, then use `window.BZ.Button`, `BZ.Logo` etc. Logo paths in `bundle.js` are relative to this folder; pass `src` to `Logo` if you host the files elsewhere.

## Notes

- Brand fonts (Helvetica Neue, Helvetica Neue Condensed Bold, DIN Next LT Arabic) are licensed and not included. The CSS falls back to Arial / Roboto Condensed / Noto Kufi Arabic. Install the real fonts from the organization's font pack.
- No icon set yet: use a simple line icon family in `ink` or `burgundy`.
