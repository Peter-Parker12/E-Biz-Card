async function loadConfig() {
  const res = await fetch("config.json", { cache: "no-store" });
  return res.json();
}

function escapeVCard(value) {
  return String(value).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

function buildVCard(config) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(config.name)};;;;`,
    `FN:${escapeVCard(config.name)}`,
    config.title ? `TITLE:${escapeVCard(config.title)}` : null,
    config.email ? `EMAIL:${escapeVCard(config.email)}` : null,
    config.phone ? `TEL:${escapeVCard(config.phone)}` : null,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

function downloadVCard(config) {
  const vcard = buildVCard(config);
  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.name.replace(/\s+/g, "_")}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderExtraLink(link) {
  const a = document.createElement("a");
  a.className = "btn secondary";
  a.href = link.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = link.label;
  return a;
}

function render(config) {
  document.getElementById("email-display").textContent = config.email || "";
  document.getElementById("tagline-display").textContent = config.tagline || "";
  document.getElementById("name-display").textContent = config.name || "";
  document.getElementById("title-display").textContent = config.title || "";
  document.getElementById("credit-display").textContent = config.credit || "";

  const emailLink = document.getElementById("email-link");
  if (config.email) {
    emailLink.href = `mailto:${config.email}`;
    emailLink.textContent = "Email Me";
    emailLink.hidden = false;
  }

  const callLink = document.getElementById("call-link");
  if (config.phone) {
    callLink.href = `tel:${config.phone}`;
    callLink.textContent = "Call";
    callLink.hidden = false;
  }

  const actionsEl = document.getElementById("actions");
  (config.links || [])
    .filter((link) => link.url)
    .forEach((link) => actionsEl.appendChild(renderExtraLink(link)));

  document.getElementById("save-contact-btn").addEventListener("click", () => downloadVCard(config));
}

loadConfig().then(render).catch((err) => console.error("Failed to load config.json", err));
