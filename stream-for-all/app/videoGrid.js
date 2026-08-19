import { VideoTile } from "./components/VideoTile.js";

let grid, emptyHint, thumbs, roomCard, zoomStage;
let blockMode = false;
const GAP = 12;

export function initVideoGrid(refs) {
  grid = refs.grid;
  emptyHint = refs.emptyHint;
  thumbs = refs.thumbs;
  roomCard = refs.roomCard;
  zoomStage = refs.zoomStage;
  if (zoomStage && typeof ResizeObserver !== "undefined") {
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
    onZoom: zoomable ? () => toggleZoom() : null
  });
  const video = tile.querySelector("video");
  if (document.hidden) video.autoplay = false;
  video.addEventListener("loadedmetadata", fitStage);
  (blockMode ? zoomStage : grid).appendChild(tile);
  tile.setZoomed?.(blockMode);
  updateZoomMode();
}

export function toggleZoom() {
  setBlockMode(!blockMode);
}

function setBlockMode(on) {
  blockMode = on;
  const dest = on ? zoomStage : grid;
  for (const t of [...zoomStage.children, ...grid.children]) {
    if (t.parentElement !== dest) dest.appendChild(t);
  }
  for (const t of dest.children) {
    t.setZoomed?.(on);
    if (!on) { t.style.width = ""; t.style.height = ""; t.style.flex = ""; }
  }
  for (const v of dest.querySelectorAll("video")) v.play().catch(() => {});
  updateZoomMode();
}

export function removeVideo(key) {
  document.getElementById("tile-" + key)?.remove();
  updateZoomMode();
}

function fitStage() {
  if (!blockMode || !zoomStage) return;
  const tiles = [...zoomStage.children];
  if (!tiles.length) return;
  const W = zoomStage.clientWidth;
  const H = zoomStage.clientHeight;
  const n = tiles.length;
  const ratios = tiles.map((t) => {
    const v = t.querySelector("video");
    return (v?.videoWidth || 1280) / (v?.videoHeight || 720);
  });
  let best = null;
  for (let rows = 1; rows <= n; rows++) {
    const cols = Math.ceil(n / rows);
    const cw = (W - GAP * (cols - 1)) / cols;
    const ch = (H - GAP * (rows - 1)) / rows;
    if (cw <= 0 || ch <= 0) continue;
    let area = 0;
    const sizes = ratios.map((ar) => {
      const w = Math.min(cw, ch * ar);
      const h = w / ar;
      area += w * h;
      return [w, h];
    });
    if (!best || area > best.area) best = { area, sizes };
  }
  if (!best) return;
  tiles.forEach((t, i) => {
    t.style.width = Math.floor(best.sizes[i][0]) + "px";
    t.style.height = Math.floor(best.sizes[i][1]) + "px";
    t.style.flex = "0 0 auto";
  });
}

function updateZoomMode() {
  if (zoomStage) {
    zoomStage.hidden = zoomStage.children.length === 0;
    roomCard?.classList.toggle("zoom-mode", blockMode);
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
  const hasTiles = grid.children.length > 0 || (zoomStage && zoomStage.children.length > 0);
  emptyHint.hidden = hasTiles || thumbs.children.length > 0;
}
