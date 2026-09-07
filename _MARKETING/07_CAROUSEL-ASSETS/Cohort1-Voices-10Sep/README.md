# Inside Cohort 1 — 10 September carousel

Learner-voice carousel, 5 slides, 1080×1350 (4:5). Rebuilt from the
`10Sep_carousel.pdf` template with real Cohort 1 quotes.

    Cover → Simarpreet → Gursheen → Khushi → Cohort 2 CTA

## NOT READY TO POST

Two things are still placeholders:

1. **Headshots.** `photos/` is empty. Slides 2–4 render the template's
   pale-blue circle until the files are there.
2. **Degrees.** Slides 2–4 read `Cohort 1 · [DEGREE]`. Per BRAND.md §7,
   the bracket stays visible until real values replace it — so a
   half-finished slide can't be posted by accident.

Consent for quote + first name + photo also needs to be on file per
learner before this goes out.

## Building it

    python3 render.py                      # trimmed quotes (recommended)
    python3 render.py --variant verbatim   # quotes exactly as sent

Writes `out/<variant>/slide_1..5.png` and `out/<variant>/carousel.pdf`.
The renderer prints the type size each quote settled at, and errors
loudly if a quote can't fit its band.

## The two variants

The template was drawn for ~180-character quotes at 44px. The real
quotes run 350–530 characters, so something has to give.

| | quote type size | note |
|---|---|---|
| `trimmed` | 36px | deletion-only cuts — no rewording, no paraphrase |
| `verbatim` | 31–37px | every word as sent; type rides smaller |

`trimmed` is the recommendation. The cuts only drop trailing sentences;
nobody's words are rewritten, which keeps faith with the template's own
instruction not to tidy the quotes.

Both variants live in `carousel.html` under `CONTENT.learners` as
`trimmed` / `verbatim` fields, so the cuts are auditable against what
each learner actually sent.

## Adding the photos

Drop three files into `photos/` named:

    simarpreet.jpg    gursheen.jpg    khushi.jpg

Square, 600×600 or larger. They're centre-cropped into a 56px circle,
so anything roughly head-and-shoulders works. Re-run `render.py`.

## Editing copy

Everything editable is in the `CONTENT` block at the top of the
`<script>` in `carousel.html`. Below that block is layout only.

## Design provenance

Geometry, colour and opacity are lifted from the original template
rather than eyeballed — same 96px margins, same 1080×1350 artboard,
same type scale, same 5-segment progress indicator.

- Navy `#0A2A43`, blue `#00589E`, cyan `#4AD0FF`, slate `#5A6B7B`,
  pale blue `#E8F2FB`, muted-on-navy `#9DB0C0` — all BRAND.md tokens.
- Dark slides: radial gradient `#113453 → #0A2A43 (42%) → #061B2C`.
- Light slides: linear `#FFFFFF → #F1F6FC`.
- Quote mark is navy at 12.94% — a watermark, not solid.
- `assets/logo.png` is the locked brand logo, used unmodified.

**Type note:** the carousel set uses Instrument Sans + Inter Tight
Italic, not the Fraunces + Plus Jakarta Sans that BRAND.md specifies
for the website. That's inherited from the template and kept for
continuity with the other carousels — worth a deliberate decision at
some point, but not one to make silently inside a single post.

The original template was itself produced by headless Chrome
(`Producer: Skia/PDF`), so this rebuild uses the same rendering path.
