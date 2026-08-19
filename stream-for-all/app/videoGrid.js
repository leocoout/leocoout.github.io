import { VideoTile } from "./components/VideoTile.js";

let grid, emptyHint, thumbs, roomCard, zoomStage;
let blockMode = false;

export function initVideoGrid(refs) {
  grid = refs.grid;
  emptyHint = refs.emptyHint;
  thumbs = refs.thumbs;
  roomCard = refs.roomCard;
  zoomStage = refs.zoomStage;
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
  if (document.hidden) tile.querySelector("video").autoplay = false;
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
  for (const t of dest.children) t.setZoomed?.(on);
  for (const v of dest.querySelectorAll("video")) v.play().catch(() => {});
  updateZoomMode();
}

export function removeVideo(key) {
  document.getElementById("tile-" + key)?.remove();
  if (blockMode && zoomStage.children.length === 0) setBlockMode(false);
  else updateZoomMode();
}

function updateZoomMode() {
  if (zoomStage) {
    zoomStage.hidden = zoomStage.children.length === 0;
    roomCard?.classList.toggle("zoom-mode", blockMode);
    const roomActions = document.getElementById("room-actions");
    const headerActions = document.getElementById("header-actions");
    if (roomActions && headerActions && roomCard) {
      if (blockMode && roomActions.parentElement !== headerActions.parentElement) {
        headerActions.parentElement.insertBefore(roomActions, headerActions);
      } else if (!blockMode && roomActions.parentElement !== roomCard) {
        roomCard.insertBefore(roomActions, document.getElementById("waiting"));
      }
    }
  }
  updateEmpty();
}

export function updateEmpty() {
  const hasTiles = grid.children.length > 0 || (zoomStage && zoomStage.children.length > 0);
  emptyHint.hidden = hasTiles || thumbs.children.length > 0;
}
