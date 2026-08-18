const STORE_URL = "";
const EXTENSION_ID = "";

const msg = document.getElementById("msg");
const store = document.getElementById("store");

const code = (location.hash.slice(1) || new URLSearchParams(location.search).get("join") || "").trim();

function showInstall() {
  if (STORE_URL) {
    location.href = STORE_URL;
    return;
  }
  msg.textContent = "Instale a extensão Stream for All para abrir esta sala.";
  store.hidden = false;
  store.href = "#";
}

if (EXTENSION_ID && window.chrome?.runtime?.sendMessage) {
  chrome.runtime.sendMessage(EXTENSION_ID, { type: "sfa-open", join: code }, (res) => {
    if (chrome.runtime.lastError || !res?.installed) showInstall();
    else msg.textContent = "Abrindo a sala no app…";
  });
} else {
  showInstall();
}
