# The Rook

The website for **The Rook**, which helps studios:

1. **Unscripted:** sharpen the quality and focus of their unscripted slates.
2. **Branded entertainment:** build a branded entertainment business and climb from production fees to owned IP.
3. **AI transformation:** refound the studio around AI, in partnership with [Substrate](ai.html#substrate).

It is a static site with no framework and no runtime dependencies, so any static host can serve it (GitHub Pages, Netlify, Vercel, S3, Cloudflare Pages).

## Pages

| Page | File | Source |
| --- | --- | --- |
| Home: why now, the shift in six moves, the three practices | `index.html` | `src/pages/index.html` |
| Unscripted | `unscripted.html` | `src/pages/unscripted.html` |
| Branded entertainment | `branded-entertainment.html` | `src/pages/branded-entertainment.html` |
| AI transformation, with Substrate | `ai.html` | `src/pages/ai.html` |
| Approach: how an engagement runs | `approach.html` | `src/pages/approach.html` |
| Not found | `404.html` | `src/pages/404.html` |

## Editing

Edit the files in `src/`, then rebuild:

```sh
python3 build.py
```

`build.py` wraps each page in the shared `<head>`, header and footer from `src/partials/` and writes the finished HTML to the repository root. Commit both `src/` and the built files. The root files are what the host serves.

Settings at the top of `build.py`:

- `contact_email`: the address behind every "Start a conversation" link. **Confirm it before launch.**
- `origin`: the production URL, used for canonical links and the absolute social-card image (for example `https://therook.example`).
- `base`: the path the site is served from, `/` by default. Only `404.html` uses it, so the not-found page keeps its styles at any depth (`/some/old/page`). On a GitHub Pages project site without a custom domain, set it to `/therookstudios/`.

To preview locally, serve the root from any static server, for example `python3 -m http.server`, and open http://localhost:8000.

## Design

The visual language comes from The Rook's proposal decks: a flat night-indigo field, Archivo (expanded for headlines and labels), and flat violet, teal, magenta and gold.

All imagery is drawn in code. The site uses no photography and no third-party images.

- **The flock** (`assets/js/rook.js`). On the home page, about 1,500 rooks fly in and assemble into one large rook in flight, which flaps slowly. Single birds leave and others arrive to take their place; a group of rooks is called a *building*. Each page closes with the flock forming the wordmark.
- **Ambient flocks** cross the sky behind the content, and close passes sweep past the lens at some section breaks.
- **The rookery**: a tree of nests drawn on canvas, with rooks circling it.
- Charts are plain HTML, CSS and inline SVG.

Users who set *prefers-reduced-motion* get the finished shapes without animation, and every reveal is shown at once.

Fonts: Archivo by Omnibus-Type, self-hosted from `assets/fonts/` under the SIL Open Font License (`assets/fonts/OFL.txt`).

## Data

Every statistic on the site cites its source, either inline or in the **Sources** list on its page. All figures were checked against their primary sources as of **October 1, 2026**. Statistics age, so re-check them before major updates. The most time-sensitive are the Nielsen Gauge (monthly), FilmLA (quarterly), BLS employment (monthly) and the IAB creator ad spend report (annual).

Scenarios on the AI page are labeled as illustrative. Their names and numbers are invented.
