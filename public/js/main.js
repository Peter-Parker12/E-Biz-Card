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
  document.getElementById("brand-name").textContent = config.brand || "";
  document.getElementById("brand-subtitle").textContent = config.brandSubtitle || "";
  document.getElementById("name-display-front").textContent = config.name || "";
  document.getElementById("title-display-front").textContent = config.title || "";
  document.getElementById("card-number-display").textContent = config.cardNumber || "";
  document.getElementById("id-number-display").textContent = config.idNumber || "";

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
  document.getElementById("brand-name-back").textContent = config.brand || "";
  document.getElementById("signature-text").textContent = config.name || "";
  document.getElementById("id-number-back").textContent = config.idNumber || "";
  document.getElementById("name-display-back").textContent = config.name || "";

  // Contact / save page
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
