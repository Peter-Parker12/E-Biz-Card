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

const LINK_ICONS = {
  linkedin:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v15h-4V8zM8.5 8h3.84v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-6.94c0-1.66-.03-3.79-2.31-3.79-2.32 0-2.67 1.8-2.67 3.67V23h-4V8z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>',
  twitter:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.4c-.6 0-1.3-.2-1.8-.5v.1a4.1 4.1 0 0 0 3.3 4 4.2 4.2 0 0 1-1.8.1 4.1 4.1 0 0 0 3.8 2.8A8.2 8.2 0 0 1 2 18.4a11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg>',
  website:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z"/></svg>',
  whatsapp:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2zm5.8 14.3c-.2.6-1.4 1.2-2 1.3-.5.1-1.1.2-3.5-.7-2.9-1.1-4.8-4-5-4.2-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.8 2 .9 2.1.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.2.8.2.4.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.7.4.1.6.1.8-.1.2-.2.9-1 1.1-1.4.2-.4.5-.3.7-.2.3.1 1.7.8 2 1 .3.1.5.2.5.3.1.2.1.6-.1 1.1z"/></svg>',
  facebook:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.3h-3V7.6c0-.9.3-1.6 1.7-1.6h1.4V3.1C16.4 3 15.3 3 14.1 3c-2.6 0-4.4 1.6-4.4 4.5v2.2H7v3.3h2.7V21z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></svg>',
};

const CATEGORY_ORDER = ["Contact", "Professional", "Social"];

function renderLinkButton({ label, url, icon }) {
  const a = document.createElement("a");
  a.className = "btn secondary";
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const svg = LINK_ICONS[String(icon || "").toLowerCase()];
  if (svg) {
    const iconSpan = document.createElement("span");
    iconSpan.innerHTML = svg;
    a.appendChild(iconSpan.firstChild);
  }

  const labelSpan = document.createElement("span");
  labelSpan.textContent = label;
  a.appendChild(labelSpan);

  return a;
}

function renderActionGroups(config) {
  const groups = new Map();
  const addToGroup = (category, item) => {
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(item);
  };

  if (config.email) {
    addToGroup("Contact", { label: "Email", url: `mailto:${config.email}`, icon: "email" });
  }
  (config.links || [])
    .filter((link) => link.url)
    .forEach((link) => addToGroup(link.category || "Other", link));

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => groups.has(c)),
    ...[...groups.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const container = document.getElementById("action-groups");
  orderedCategories.forEach((category) => {
    const groupEl = document.createElement("div");
    groupEl.className = "action-group";

    const labelEl = document.createElement("div");
    labelEl.className = "action-group-label";
    labelEl.textContent = category;
    groupEl.appendChild(labelEl);

    const rowEl = document.createElement("div");
    rowEl.className = "action-group-row";
    groups.get(category).forEach((item) => rowEl.appendChild(renderLinkButton(item)));
    groupEl.appendChild(rowEl);

    container.appendChild(groupEl);
  });
}

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function render(config) {
  // Front of ID card
  const brandNameFront = document.getElementById("brand-name");
  brandNameFront.textContent = config.brand || "";
  if (config.backBrandUrl) brandNameFront.href = config.backBrandUrl;
  document.getElementById("brand-subtitle").textContent = config.brandSubtitle || "";
  document.getElementById("name-display-front").textContent = config.name || "";
  document.getElementById("title-display-front").textContent = config.title || "";
  document.getElementById("card-number-display").textContent = config.cardNumber || "";
  document.getElementById("id-number-display").textContent = config.guid ? `GUID: ${config.guid}` : "";

  const barcodeLink = document.getElementById("barcode-link");
  if (config.barcodeUrl) {
    barcodeLink.href = config.barcodeUrl;
  }

  const tagsList = document.getElementById("tags-list");
  (config.tags || []).forEach((tag) => {
    const li = document.createElement("li");
    li.textContent = tag;
    tagsList.appendChild(li);
  });

  const photoImg = document.getElementById("photo-img");
  const photoInitials = document.getElementById("photo-initials");
  if (config.photo) {
    photoImg.src = config.photo;
    photoImg.style.objectPosition = config.photoPosition || "center";
    photoImg.hidden = false;
    photoInitials.hidden = true;
  } else {
    photoInitials.textContent = getInitials(config.name);
  }

  // Back of ID card
  const backBrand = document.getElementById("brand-name-back");
  backBrand.textContent = config.brand || "";
  if (config.backBrandUrl) backBrand.href = config.backBrandUrl;

  const backBrandSecondary = document.getElementById("brand-name-back-secondary");
  if (config.backSecondaryText) {
    backBrandSecondary.textContent = config.backSecondaryText;
    if (config.backSecondaryUrl) backBrandSecondary.href = config.backSecondaryUrl;
    document.getElementById("brand-sep").hidden = false;
  }

  document.getElementById("id-number-back").textContent = config.guid ? `GUID: ${config.guid}` : "";
  document.getElementById("name-display-back").textContent = config.name || "";

  // Contact / save page
  document.getElementById("credit-display").textContent = config.credit || "";
  renderActionGroups(config);

  document.getElementById("save-contact-btn").addEventListener("click", () => downloadVCard(config));
}

loadConfig().then(render).catch((err) => console.error("Failed to load config.json", err));
