# Digital Business Card

A mobile-first digital business card, served as a static site in Docker, with content
editable at runtime via `config/config.json` — no rebuild needed to change your email,
phone, or links.

## Project layout

```
public/            static site (HTML/CSS/JS)
  css/theme.css     design tokens (colors, gradient, fonts) — edit to restyle
  css/main.css      layout — rarely needs edits
  js/main.js        fetches config.json at runtime and renders the page
config/config.json  your content (name, email, phone, links, tagline) — edit anytime
nginx/default.conf  nginx server block
Dockerfile
docker-compose.yml
```

## Editing content (no rebuild)

Edit `config/config.json` on the VPS and refresh the page in your browser — it's
volume-mounted into the container, so changes are picked up immediately (the app
fetches it with `cache: no-store`).

```json
{
  "brand": "OURPEOPLE",
  "brandSubtitle": "Business Card",
  "tags": ["Art Direction", "Curation", "Strategy", "Networking"],
  "photo": "",
  "photoPosition": "center",
  "cardNumber": "01",
  "idNumber": "770776",
  "name": "NHAT HAI DAO",
  "title": "ART MANAGER",
  "tagline": "Collecting People. Curating Possibilities",
  "email": "haidn.4v@gmail.com",
  "phone": "",
  "links": [{ "label": "LinkedIn", "url": "https://linkedin.com/in/...", "icon": "linkedin" }],
  "credit": "design by OURPEOPLE studio"
}
```

- `brand`/`brandSubtitle` and `tags` fill the ID-card front (brand wordmark, tag list).
- `photo` is a URL/path to a photo; leave empty to show initials derived from `name` instead.
- `photoPosition` controls how the photo is cropped inside its square box (it's an
  `object-fit: cover` crop, so the photo's aspect ratio may not match the box).
  Accepts any CSS `object-position` value, e.g. `"center"`, `"top"`, `"bottom"`,
  `"left"`, `"right"`, or precise offsets like `"50% 20%"` to shift the visible
  crop up/down/left/right until the part of the photo you want is in frame.
- `cardNumber` and `idNumber` are the small numbers on the front/back (purely decorative, like the reference ID badge).
- Empty `phone` or link `url` values are automatically hidden on the page.

## Restyling (requires rebuild)

Edit variables in `public/css/theme.css` (colors, gradient stops, fonts), then:

```bash
docker compose up -d --build
```

## Deploying on the VPS

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

### Adding HTTPS

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
3. Open the app → **Write** tab → **Add a record** → **URL/URI** → enter
   `https://yourdomain.com`.
4. Tap **Write**, then hold the top edge of your iPhone (near the camera, where the
   NFC antenna is) against the tag until it confirms the write.
5. Optional: use **Tools → Lock tag** to make the tag permanently read-only once
   you're confident the URL is final. (This locks the tag, not your page — you can
   still edit `config/config.json` freely afterward.)
6. Test it: tap another iPhone or Android phone against the tag. It should show a
   notification banner offering to open the link in Safari/Chrome — no app needed on
   the scanning phone (NDEF URI records are natively supported by iOS 11+ and Android
   background NFC reading).

Since the tag only stores the URL, and the page content is loaded live from
`config/config.json`, you can update your email/phone/links anytime without ever
reprogramming the tag.
