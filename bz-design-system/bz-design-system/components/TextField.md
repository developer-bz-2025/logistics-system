# TextField

A single-line form field, matching the website's newsletter signup field. The consumer provides `label`, `name`, `type` (for example `email`), `placeholder` and any other input props.

- 40px tall, 0 × 15px padding, `radius-sm` (3px), a 0.8px `input-border` (mauve) border, `input-bg` fill, and `ink-soft` text at 16px.
- On focus, the border turns burgundy, the fill turns `surface`, and a `focus-ring` appears.
- The mauve border is faint (2.1:1 on white). Always give the field a visible label. Don't rely on the border alone to show that the field is there.
