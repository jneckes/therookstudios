#!/usr/bin/env python3
"""Builds The Rook site.

Pages are written in src/pages/*.html. Each page starts with a front-matter block:

    <!--
    title: Page title
    description: One sentence for search and social cards.
    nav: home | unscripted | branded | ai | approach
    bars: yes            (optional: cinematic letterbox reveal on first visit)
    -->

The build wraps every page in the shared <head>, header and footer from src/partials
and writes the result to the repository root, where any static host can serve it.

    python3 build.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SITE = {
    "name": "The Rook",
    # Confirm before launch: the address every "Start a conversation" link uses.
    "contact_email": "hello@therookstudios.com",
    # Set to the production origin (no trailing slash) for canonical and social URLs.
    "origin": "",
    # The path the site is served from. The 404 page uses it so its links and assets
    # resolve at any depth (/some/missing/page). Use "/therookstudios/" for a GitHub
    # Pages project site without a custom domain.
    "base": "/",
}
NAV = [
    ("unscripted", "unscripted.html", "Unscripted"),
    ("branded", "branded-entertainment.html", "Branded entertainment"),
    ("ai", "ai.html", "AI, with Substrate"),
    ("approach", "approach.html", "Approach"),
]


def front_matter(text):
    m = re.match(r"\s*<!--(.*?)-->", text, re.S)
    if not m:
        raise SystemExit("page is missing its front-matter block")
    meta = {}
    for line in m.group(1).strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, text[m.end():].lstrip("\n")


def render(template, values):
    return re.sub(r"\{\{(\w+)\}\}", lambda m: values.get(m.group(1), ""), template)


def rooted(html, base):
    """Point relative links and assets at the site root, and contact links at the home page."""
    html = html.replace('href="#contact"', f'href="{base}#contact"')
    return re.sub(r'(\s(?:href|src))="(?![a-z][a-z0-9+.-]*:|#|/)([^"]*)"', rf'\1="{base}\2"', html)


def build():
    partials = {p.stem: p.read_text() for p in (SRC / "partials").glob("*.html")}
    out = []
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = front_matter(page.read_text())
        current = meta.get("nav", "")
        mark = ' aria-current="page"'
        nav = "\n".join(
            f'        <a href="{href}"{mark if key == current else ""}>{label}</a>'
            for key, href, label in NAV
        )
        values = {
            "title": meta.get("title", SITE["name"]),
            "description": meta.get("description", ""),
            "nav": nav,
            "email": SITE["contact_email"],
            "file": page.name,
            "canonical": f'<link rel="canonical" href="{SITE["origin"]}/{"" if page.name == "index.html" else page.name}">' if SITE["origin"] else "",
            "bars": '<div class="bars" aria-hidden="true"><i></i><i></i></div>' if meta.get("bars") == "yes" else "",
            "home": ' aria-current="page"' if current == "home" else "",
            "ogimage": f'{SITE["origin"]}/assets/img/og.png' if SITE["origin"] else "assets/img/og.png",
        }
        body = render(body, values)
        html = render(partials["head"], values) + render(partials["header"], values) + body + render(partials["footer"], values)
        if page.name == "404.html":
            html = rooted(html, SITE["base"])
        (ROOT / page.name).write_text(html)
        out.append(page.name)
    print("built:", ", ".join(out))


if __name__ == "__main__":
    build()
