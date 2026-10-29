# Button

A burgundy action button as used on basmeh-zeitooneh.org; use `primary` once per view for the main action. The consumer provides the label (children) and `onClick`. Variants:

- `primary`: burgundy fill, white label, `radius-sm` (3px), padding `space-3` × `space-6` (12px × 24px), `button` text (15px, 600). Hover goes to `burgundy-dark`. Examples: "View Programs", "View More".
- `compact`: the header Donate button. Same colours, padding 5px × `space-5` (20px), weight 500.
- `secondary`: burgundy outline, fills on hover.
- `inverse`: white fill, burgundy label, for `surface-brand` panels.
- `hero`: white fill, burgundy uppercase `button-caps` label (12px, 600), `radius-slider` (15px), 45px tall. Only over hero photos ("Learn more", "Donate through JustGiving").

Rules:

- Labels are sentence case and start with a verb. Only `hero` is uppercase.
- No shadows.
- On a burgundy panel, use `inverse`, never `primary`.
