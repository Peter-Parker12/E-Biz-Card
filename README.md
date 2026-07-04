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
  "name": "NHAT HAI DAO",
  "title": "ART MANAGER",
  "tagline": "Collecting People. Curating Possibilities",
  "email": "haidn.4v@gmail.com",
  "phone": "",
  "links": [{ "label": "LinkedIn", "url": "https://linkedin.com/in/...", "icon": "linkedin" }],
  "credit": "design by OURPEOPLE studio"
}
```

Empty `phone` or link `url` values are automatically hidden on the page.

## Restyling (requires rebuild)

Edit variables in `public/css/theme.css` (colors, gradient stops, fonts), then:

```bash
docker compose up -d --build
```

## Deploying on the VPS

Prerequisite: your domain's DNS A record already points at the VPS's IP, and ports
80/443 are free on the host (no existing reverse proxy).

1. Copy this project to the VPS, e.g. via `git clone` or `scp -r`.
2. From the project root:

   ```bash
   docker compose up -d --build
   ```

3. Visit `http://yourdomain.com` from a phone to confirm it loads.

### Adding HTTPS

HTTPS is recommended since NFC taps open the link directly in Safari, and the
"Save Contact" download works best on a secure origin.

1. Stop the container temporarily so port 80 is free, then get a certificate:

   ```bash
   docker compose down
   sudo certbot certonly --standalone -d yourdomain.com
   ```

2. Symlink or copy the resulting cert directory next to the project so it can be
   volume-mounted, e.g. `sudo ln -s /etc/letsencrypt ./certs`.
3. In `nginx/default.conf`, uncomment the `server { listen 443 ssl; ... }` block and
   set `server_name` to your real domain.
4. In `docker-compose.yml`, uncomment the `443:443` port mapping and the `./certs`
   volume line.
5. Rebuild and restart:

   ```bash
   docker compose up -d --build
   ```

6. Renew certs periodically (certbot sets up a systemd timer/cron by default); after
   renewal, run `docker compose restart` so nginx picks up the new cert files.

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
