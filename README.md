# Digital Business Card

A mobile-first digital business card. Hosted for free on **GitHub Pages**, with
content editable by committing to `docs/config.json` — no build step, no server
to run. A Docker/VPS setup is also included as an alternative if you ever want
to self-host instead.

## Project layout

```
docs/                site root — this is what GitHub Pages serves
  index.html
  config.json         your content (name, email, phone, links, tagline) — edit anytime
  css/theme.css        design tokens (colors, gradient, fonts) — edit to restyle
  css/main.css         layout — rarely needs edits
  js/main.js           fetches config.json at runtime and renders the page
  assets/              photo(s) go here
  .nojekyll            tells GitHub Pages not to run Jekyll on this folder
nginx/default.conf     (Docker/VPS option only)
Dockerfile             (Docker/VPS option only)
docker-compose.yml     (Docker/VPS option only)
```

## Hosting on GitHub Pages (primary)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the repo on GitHub: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Branch: `main`, folder: **`/docs`** → **Save**.
5. GitHub gives you a URL like `https://Peter-Parker12.github.io/E-Biz-Card/` —
   usually live within a minute or two. HTTPS is automatic.

### Editing content

Edit `docs/config.json` in the repo (directly on GitHub, or locally then
`git push`) and it goes live as soon as GitHub Pages redeploys (usually well
under a minute). There's no server to restart — GitHub Pages just serves the
file directly, and the app fetches it with `cache: no-store` so you always get
the latest version.

```json
{
  "brand": "4V VIETNAM",
  "brandSubtitle": "Business Card",
  "tags": ["Creative Leadership", "Arts Management", "Curation", "Strategy", "Networking"],
  "photo": "assets/photo.jpg",
  "photoPosition": "center",
  "cardNumber": "01",
  "barcodeUrl": "https://your-portfolio-site.example/",
  "name": "NHAT HAI DAO",
  "title": "ART MANAGER",
  "tagline": "Collecting People. Curating Possibilities",
  "email": "haidn.4v@gmail.com",
  "phone": "",
  "backBrandUrl": "https://your-brand-site.example/",
  "backSecondaryText": "ONLYPANTS.VN",
  "backSecondaryUrl": "https://your-other-brand-site.example/",
  "guid": "3137434",
  "links": [{ "label": "LinkedIn", "url": "https://linkedin.com/in/...", "icon": "linkedin", "category": "Professional" }],
  "credit": "design by 4V VIETNAM studio"
}
```

- `brand`/`brandSubtitle` and `tags` fill the ID-card front (brand wordmark, tag list).
- `photo` is a path (e.g. `assets/photo.jpg`) or full URL to a photo; leave empty
  to show initials derived from `name` instead. If it's a path, put the actual
  file in `docs/assets/` and commit it.
- `photoPosition` controls how the photo is cropped inside its square box (it's
  an `object-fit: cover` crop, so the photo's aspect ratio may not match the
  box). Accepts any CSS `object-position` value, e.g. `"center"`, `"top"`,
  `"bottom"`, `"left"`, `"right"`, or precise offsets like `"50% 20%"`.
- `cardNumber` is the small decorative number next to the title on the front
  (like the reference ID badge).
- `barcodeUrl` makes the front card's barcode graphic a clickable link to that URL.
- `backBrandUrl` makes the back card's brand name a clickable link.
- `backSecondaryText`/`backSecondaryUrl` add a second linked line below the brand
  name on the back (e.g. a second brand/site); leave `backSecondaryText` empty to
  hide it.
- `guid` shows as `GUID: <value>` both under the front card's barcode and on the
  back card, in place of a plain serial number.
- Empty `phone`, `backSecondaryText`, or link `url` values are automatically hidden.
  (`phone` itself no longer renders a dedicated button — use a WhatsApp link instead.)
- `links[].icon` picks which icon shows: `"linkedin"`, `"instagram"`, `"twitter"`,
  `"website"`, `"whatsapp"`, or `"facebook"`. For WhatsApp, use a `https://wa.me/<countrycode+number>`
  URL with no `+`, spaces, or leading zeros (e.g. `https://wa.me/84866427222`).
- `links[].category` groups links together on the contact/save page under a small
  label (e.g. `"Contact"`, `"Professional"`, `"Social"`), keeping the page compact
  instead of one long list. Your `email` (if set) is automatically placed in the
  `"Contact"` group. Any category name works; `"Contact"`, `"Professional"`, and
  `"Social"` are shown first in that order, other category names appear after.

Keep photos reasonably small (a few hundred KB) — this loads on a phone right
after an NFC tap, so a multi-MB DSLR export will feel slow.

### Restyling

Edit variables in `docs/css/theme.css` (colors, gradient stops, fonts) and push
— no build step needed, GitHub Pages just serves the updated file.

### Custom domain (optional)

If you'd rather use your own domain than the `github.io` URL:

1. Add a `docs/CNAME` file containing just your domain, e.g. `card.yourdomain.com`.
2. In your DNS provider, add a `CNAME` record for that subdomain pointing at
   `Peter-Parker12.github.io`.
3. In GitHub **Settings → Pages**, the custom domain field should pick this up;
   enable **Enforce HTTPS** once the certificate provisions (can take a bit).

## Alternative: self-hosting with Docker on a VPS

If you'd rather run this yourself instead of using GitHub Pages, the Docker
setup in this repo still works, serving the same `docs/` folder.

Prerequisite: your domain's DNS A record already points at the VPS's IP.

**If port 80/443 on the VPS is already used by another reverse proxy** (common if
the VPS hosts other sites/containers), don't fight over the port — pick a free
host port for this container and let the existing reverse proxy forward to it.

1. Copy this project to the VPS, e.g. via `git clone` or `scp -r`.
2. In `docker-compose.yml`, set the host-side port to something free, e.g.:
   ```yaml
   ports:
     - "3480:80"   # left side = free host port, right side must stay 80
   ```
3. Start it:
   ```bash
   docker compose up -d --build
   ```
4. Confirm the container itself answers: `curl -sI http://localhost:3480` should
   return `HTTP/1.1 200 OK`.
5. Add a server block to the **existing** host reverse proxy for this card's domain,
   pointing at the port you chose, e.g. for host nginx in
   `/etc/nginx/sites-available/` (or `conf.d/`):
   ```nginx
   server {
       listen 80;
       server_name card.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3480;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Symlink it into `sites-enabled` if needed, then `sudo nginx -t && sudo systemctl reload nginx`.
6. Visit `http://card.yourdomain.com` from a phone to confirm it loads.

**If port 80/443 is free** (no existing reverse proxy), you can instead map this
container directly to it (`"80:80"` in `docker-compose.yml`) and skip the extra
server block.

Editing content this way: since the whole `docs/` directory is volume-mounted
into the container (see `docker-compose.yml`), editing any file — including
`docs/config.json` — is picked up immediately on refresh, no rebuild needed.
Adding new files (like a new photo) also just works without a rebuild, since
the mount is live.

### Adding HTTPS (Docker/VPS option only)

HTTPS is recommended since NFC taps open the link directly in Safari, and the
"Save Contact" download works best on a secure origin.

- **With an existing host reverse proxy** (the common case above): terminate TLS
  there, not in this container. Run `sudo certbot --nginx -d card.yourdomain.com`
  (or your proxy's equivalent) — it edits the server block from step 5 in place to
  add the `443` listener and certs. Nothing in this project needs to change.
- **Without an existing reverse proxy** (this container owns port 80/443 directly):
  1. Stop the container temporarily so port 80 is free, then get a certificate:
     ```bash
     docker compose down
     sudo certbot certonly --standalone -d yourdomain.com
     ```
  2. Symlink the cert directory next to the project: `sudo ln -s /etc/letsencrypt ./certs`.
  3. In `nginx/default.conf`, uncomment the `server { listen 443 ssl; ... }` block
     and set `server_name` to your real domain.
  4. In `docker-compose.yml`, add `"443:443"` to `ports` and
     `./certs:/etc/nginx/certs:ro` to `volumes`.
  5. `docker compose up -d --build`.
  6. Renew periodically (certbot's systemd timer/cron handles this); after renewal,
     `docker compose restart` so nginx picks up the new cert files.

## NFC setup (writing your iPhone-taps-card link to a physical tag)

Your iPhone can't be tapped by *other* phones as if it were a tag — you need a
separate, cheap passive NFC tag (a sticker or card) programmed with your site's URL.
Anyone who taps their phone on that tag will get a native prompt to open the link,
no app required on their end.

1. Buy an NTAG213 or NTAG215 NFC sticker/card (widely available on Amazon, a few
   cents to a dollar each).
2. Install a free app on your iPhone, e.g. **NFC Tools** (by wakdev) from the App Store.
3. Open the app → **Write** tab → **Add a record** → **URL/URI** → enter your
   site's URL, e.g. `https://Peter-Parker12.github.io/E-Biz-Card/`.
4. Tap **Write**, then hold the top edge of your iPhone (near the camera, where the
   NFC antenna is) against the tag until it confirms the write.
5. Optional: use **Tools → Lock tag** to make the tag permanently read-only once
   you're confident the URL is final. (This locks the tag, not your page — you can
   still edit `docs/config.json` freely afterward.)
6. Test it: tap another iPhone or Android phone against the tag. It should show a
   notification banner offering to open the link in Safari/Chrome — no app needed on
   the scanning phone (NDEF URI records are natively supported by iOS 11+ and Android
   background NFC reading).

Since the tag only stores the URL, and the page content is loaded live from
`config.json`, you can update your email/phone/links anytime without ever
reprogramming the tag. If you later switch from the `github.io` URL to a custom
domain, you will need to rewrite the tag with the new URL.
