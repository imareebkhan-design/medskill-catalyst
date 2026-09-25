import type { TextBox } from "./template-config";

/** Minimal font interface (pdf-lib PDFFont satisfies it). */
export type MeasurableFont = {
  widthOfTextAtSize(text: string, size: number): number;
};

export type FitResult =
  | { ok: true; size: number; lines: string[] }
  | { ok: false; reason: string };

function wrap(words: string[], font: MeasurableFont, size: number, width: number, maxLines: number): string[] | null {
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      current = candidate;
      continue;
    }
    if (!current) return null; // a single word wider than the box
    lines.push(current);
    current = word;
    if (font.widthOfTextAtSize(current, size) > width) return null;
    if (lines.length >= maxLines) return null;
  }
  if (current) lines.push(current);
  return lines.length <= maxLines ? lines : null;
}

/**
 * The fit rule (PRD §10): keep the design size if it fits on one line; else
 * shrink in 0.5pt steps toward minSize, preferring one line, then allow
 * wrapping up to maxLines at the largest size that fits the box height. If
 * nothing fits, the caller must block issuance — text is never clipped or
 * allowed to overflow the approved artwork.
 */
export function fitText(text: string, font: MeasurableFont, box: Pick<TextBox, "width" | "height" | "size" | "minSize" | "maxLines" | "lineHeight">): FitResult {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return { ok: false, reason: "empty" };
  const words = clean.split(" ");

  for (let lines = 1; lines <= box.maxLines; lines++) {
    for (let size = box.size; size >= box.minSize - 1e-9; size -= 0.5) {
      const needed = lines === 1 ? size : size + (lines - 1) * size * box.lineHeight;
      if (needed > box.height + 1e-6) continue;
      const wrapped = wrap(words, font, size, box.width, lines);
      if (wrapped && wrapped.length <= lines) return { ok: true, size, lines: wrapped };
    }
  }
  return { ok: false, reason: `does not fit within ${box.maxLines} line(s) at ≥ ${box.minSize}pt` };
}
