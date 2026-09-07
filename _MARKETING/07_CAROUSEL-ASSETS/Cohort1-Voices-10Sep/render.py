#!/usr/bin/env python3
"""Render carousel.html to Instagram-ready 1080x1350 PNGs plus a combined PDF.

    python3 render.py                 # trimmed quotes (default)
    python3 render.py --variant verbatim

Output lands in out/<variant>/slide_N.png and out/<variant>/carousel.pdf
"""
import argparse
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
W, H = 1080, 1350


def render(variant: str) -> None:
    out = HERE / "out" / variant
    out.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        launch = {"args": ["--no-sandbox", "--font-render-hinting=none"]}
        if pathlib.Path(CHROME).exists():
            launch["executable_path"] = CHROME
        browser = p.chromium.launch(**launch)
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        page.goto(f"file://{HERE / 'carousel.html'}?variant={variant}")
        page.wait_for_selector("html[data-ready='1']")

        sizes = page.evaluate("window.__quoteSizes")
        print(f"[{variant}] quote sizes: {sizes} px (template baseline: 44px)")

        overflows = page.evaluate("window.__overflows")
        for o in overflows:
            print(f"  WARNING: {o['name']}'s quote overruns its band by {o['by']}px "
                  f"- trim it or it will collide with the name block", file=sys.stderr)

        slides = page.query_selector_all(".slide")
        paths = []
        for i, slide in enumerate(slides, 1):
            path = out / f"slide_{i}.png"
            slide.screenshot(path=str(path))
            paths.append(path)
            print(f"  wrote {path.relative_to(HERE)}")

        browser.close()

    try:
        from PIL import Image
    except ImportError:
        print("Pillow not installed - skipping combined PDF", file=sys.stderr)
        return

    images = [Image.open(p).convert("RGB") for p in paths]
    pdf = out / "carousel.pdf"
    images[0].save(pdf, save_all=True, append_images=images[1:])
    print(f"  wrote {pdf.relative_to(HERE)}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--variant", default="trimmed", choices=["trimmed", "verbatim"])
    render(ap.parse_args().variant)
