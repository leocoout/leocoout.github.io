import { VideoTile } from "./components/VideoTile.js";

let grid, emptyHint, thumbs, roomCard, zoomStage, breakEl;
let blockMode = false;
let focusedKey = null;
const GAP = 12;
const REST_HEIGHT = 120;

const stageTiles = () => [...zoomStage.children].filter((c) => c.id?.startsWith("tile-"));

export function initVideoGrid(refs) {
  grid = refs.grid;
  emptyHint = refs.emptyHint;
  thumbs = refs.thumbs;
  roomCard = refs.roomCard;
  zoomStage = refs.zoomStage;
  breakEl = document.createElement("div");
  Object.assign(breakEl.style, { flexBasis: "100%", height: "0", order: "1", display: "none" });
  zoomStage.appendChild(breakEl);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(fitStage).observe(zoomStage);
  }
  document.addEventListener("visibilitychange", () => {
    const hidden = document.hidden;
    for (const v of document.querySelectorAll("#grid video, #zoom-stage video")) {
      if (hidden) v.pause();
      else v.play().catch(() => {});
    }
  });
}

export function attachVideo(key, label, stream, muted = false, { onStop = null, zoomable = false } = {}) {
  const existing = document.getElementById("tile-" + key);
  if (existing) {
    existing.querySelector("video").srcObject = stream;
    return;
  }
  const tile = VideoTile({
    id: key, label, stream, muted,
    onStop,
    onZoom: zoomable ? () => toggleZoom(key) : null
  });
  const video = tile.querySelector("video");
  if (document.hidden) video.autoplay = false;
  video.addEventListener("loadedmetadata", fitStage);
  (blockMode ? zoomStage : grid).appendChild(tile);
  updateZoomMode();
}

export function toggleZoom(key) {
  if (!blockMode) {
    focusedKey = key;
    setBlockMode(true);
  } else if (focusedKey === key) {
    focusedKey = null;
    updateZoomMode();
  } else {
    focusedKey = key;
    updateZoomMode();
  }
}

export function toggleGridView() {
  focusedKey = null;
  setBlockMode(!blockMode);
}

function setBlockMode(on) {
  blockMode = on;
  if (!on) focusedKey = null;
  const dest = on ? zoomStage : grid;
  for (const t of [...stageTiles(), ...grid.children]) {
    if (t.parentElement !== dest) dest.appendChild(t);
  }
  if (!on) {
    for (const t of dest.children) {
      t.style.width = ""; t.style.height = ""; t.style.flex = ""; t.style.order = "";
    }
  }
  for (const v of dest.querySelectorAll("video")) v.play().catch(() => {});
  updateZoomMode();
}

export function removeVideo(key) {
  document.getElementById("tile-" + key)?.remove();
  if (focusedKey === key) focusedKey = null;
  updateZoomMode();
}

function fitStage() {
  if (!blockMode || !zoomStage) return;
  const tiles = stageTiles();
  if (!tiles.length) return;
  const W = zoomStage.clientWidth;
  const H = zoomStage.clientHeight - 78;
  const ratio = (t) => {
    const v = t.querySelector("video");
    return (v?.videoWidth || 1280) / (v?.videoHeight || 720);
  };

  const focused = focusedKey ? tiles.find((t) => t.id === "tile-" + focusedKey) : null;

  if (focused && tiles.length > 1) {
    const rest = tiles.filter((t) => t !== focused);
    const restH = Math.min(REST_HEIGHT, H * 0.25);
    const mainH = H - restH - GAP * 2;
    const fr = ratio(focused);
    const fw = Math.min(W, mainH * fr);
    focused.style.width = Math.floor(fw) + "px";
    focused.style.height = Math.floor(fw / fr) + "px";
    focused.style.order = "0";
    focused.style.flex = "0 0 auto";

    const widths = rest.map((t) => restH * ratio(t));
    const total = widths.reduce((a, b) => a + b, 0) + GAP * (rest.length - 1);
    const scale = total > W ? (W - GAP * (rest.length - 1)) / (total - GAP * (rest.length - 1)) : 1;
    rest.forEach((t, i) => {
      t.style.width = Math.floor(widths[i] * scale) + "px";
      t.style.height = Math.floor(restH * scale) + "px";
      t.style.order = "2";
      t.style.flex = "0 0 auto";
    });
    breakEl.style.display = "block";
  } else {
    breakEl.style.display = "none";
    const n = tiles.length;
    const ratios = tiles.map(ratio);
    let best = null;
    for (let rows = 1; rows <= n; rows++) {
      const cols = Math.ceil(n / rows);
      const cw = (W - GAP * (cols - 1)) / cols;
      const ch = (H - GAP * (rows - 1)) / rows;
      if (cw <= 0 || ch <= 0) continue;
      let area = 0;
      const sizes = ratios.map((ar) => {
        const w = Math.min(cw, ch * ar);
        area += w * (w / ar);
        return w;
      });
      if (!best || area > best.area) best = { area, sizes };
    }
    if (!best) return;
    tiles.forEach((t, i) => {
      t.style.width = Math.floor(best.sizes[i]) + "px";
      t.style.height = Math.floor(best.sizes[i] / ratios[i]) + "px";
      t.style.order = "";
      t.style.flex = "0 0 auto";
    });
  }
}

function updateZoomMode() {
  if (zoomStage) {
    zoomStage.hidden = stageTiles().length === 0;
    roomCard?.classList.toggle("zoom-mode", blockMode);
    for (const t of [...stageTiles(), ...grid.children]) {
      t.setZoomed?.(blockMode && t.id === "tile-" + focusedKey);
    }
    const floating = document.getElementById("floating-controls");
    const roomActions = document.getElementById("room-actions");
    const headerActions = document.getElementById("header-actions");
    const header = document.getElementById("room-header");
    const footer = document.getElementById("room-footer");
    const sidebarFooter = document.getElementById("sidebar-footer");
    const roomPanel = document.getElementById("room-panel");
    if (floating && roomActions && headerActions && header && roomCard) {
      if (blockMode) {
        floating.hidden = false;
        if (roomActions.parentElement !== floating) floating.appendChild(roomActions);
        if (headerActions.parentElement !== floating) floating.appendChild(headerActions);
        if (footer && sidebarFooter && footer.parentElement !== sidebarFooter) sidebarFooter.appendChild(footer);
      } else {
        floating.hidden = true;
        if (roomActions.parentElement !== roomCard) roomCard.insertBefore(roomActions, document.getElementById("waiting"));
        if (headerActions.parentElement !== header) header.appendChild(headerActions);
        if (footer && roomPanel && footer.parentElement !== roomPanel) roomPanel.appendChild(footer);
      }
    }
    if (blockMode) fitStage();
  }
  updateEmpty();
}

export function updateEmpty() {
  const hasTiles = grid.children.length > 0 || (zoomStage && stageTiles().length > 0);
  emptyHint.hidden = hasTiles || thumbs.children.length > 0;
}
