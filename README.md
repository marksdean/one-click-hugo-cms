# Mark Dean Photography

The site at [markdean.studio](https://www.markdean.studio), built with [Hugo](https://gohugo.io), edited with [Decap CMS](https://decapcms.org) and deployed on Netlify.

## Editing content

Go to `/admin/` on the live site and log in.

- **Galleries** – one entry per gallery. Add, remove and drag photos to reorder them. Pick a *Category* to place the gallery under a dropdown in the menu.
- **Pages → Home page photos** – the photos on the front page.
- **Pages → Contact page** – intro text, email and phone.
- **Site Settings** – menu order and social links.

Every save is a commit to `main`, and Netlify rebuilds the site.

## How it's organised

```
content/
  home/index.md            photos on the home page (+ the image files)
  galleries/<name>/        one folder per gallery: index.md + its image files
  contact.md
data/settings.yml          menu and social links
layouts/                   templates
assets/css, assets/js      styles and the small menu script
static/admin/              Decap CMS (config.yml defines the editing forms)
static/img/                logo, favicon, share image
scripts/fetch-photos.sh    one-off import of photos from the old Squarespace site
```

Photos live next to the gallery that uses them. Upload the full-size file (about 2500px on the long edge is plenty); Hugo generates the smaller WebP sizes at build time.

Galleries are laid out as justified rows. The target row height is `rowHeight` in `hugo.toml`.

## Running locally

Install Hugo (extended) 0.169 or newer (`brew install hugo`), then:

```
hugo server
```

To use the CMS locally as well, run `npx decap-server` in a second terminal and open `http://localhost:1313/admin/`.

## Deploying

Netlify runs `hugo --gc --minify` (see `netlify.toml`). Pull requests get their own preview URL. The first build resizes every photo and takes several minutes; later builds reuse the cached sizes.

The contact form uses Netlify Forms: enable form detection under *Forms* in the Netlify dashboard, and set a notification email there.
