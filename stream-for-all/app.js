const STORE_URL = "";
const EXTENSION_ID = "";

const msg = document.getElementById("msg");
const store = document.getElementById("store");
const open = document.getElementById("open");

const code = (location.hash.slice(1) || new URLSearchParams(location.search).get("join") || "").trim();
const appUrl = code ? "app/?join=" + encodeURIComponent(code) : "app/";

function showWeb() {
  if (code) {
    location.href = appUrl;
    return;
  }
  msg.textContent = "Use no navegador ou instale a extensão.";
  open.hidden = false;
  open.href = appUrl;
  if (STORE_URL) {
    store.hidden = false;
    store.href = STORE_URL;
  }
}

if (EXTENSION_ID && window.chrome?.runtime?.sendMessage) {
  chrome.runtime.sendMessage(EXTENSION_ID, { type: "sfa-open", join: code }, (res) => {
    if (chrome.runtime.lastError || !res?.installed) showWeb();
    else msg.textContent = "Abrindo a sala no app…";
  });
} else {
  showWeb();
}
