const STORE_URL = "";

const msg = document.getElementById("msg");
const store = document.getElementById("store");

setTimeout(() => {
  if (document.documentElement.hasAttribute("data-sfa")) {
    msg.textContent = "Abrindo a sala no app…";
    return;
  }
  if (STORE_URL) {
    location.href = STORE_URL;
  } else {
    msg.textContent = "Instale a extensão Stream for All para abrir esta sala.";
    store.hidden = false;
    store.href = "#";
  }
}, 1500);
