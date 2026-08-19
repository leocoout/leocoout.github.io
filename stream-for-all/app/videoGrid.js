import { VideoTile } from "./components/VideoTile.js";

let grid, emptyHint, thumbs, roomCard, zoomStage;
const zoomedKeys = new Set();

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
  grid.appendChild(tile);
  updateEmpty();
}

export function toggleZoom(key) {
  const tile = document.getElementById("tile-" + key);
  if (!tile) return;
  if (zoomedKeys.has(key)) {
    zoomedKeys.delete(key);
    grid.appendChild(tile);
    tile.setZoomed?.(false);
  } else {
    zoomedKeys.add(key);
    zoomStage.appendChild(tile);
    tile.setZoomed?.(true);
  }
  tile.querySelector("video")?.play().catch(() => {});
  updateZoomMode();
}

export function removeVideo(key) {
  document.getElementById("tile-" + key)?.remove();
  zoomedKeys.delete(key);
  updateZoomMode();
}

function updateZoomMode() {
  if (zoomStage) {
    const zoomOn = zoomStage.children.length > 0;
    zoomStage.hidden = !zoomOn;
    roomCard?.classList.toggle("zoom-mode", zoomOn);
    const roomActions = document.getElementById("room-actions");
    const headerActions = document.getElementById("header-actions");
    if (roomActions && headerActions && roomCard) {
      if (zoomOn && roomActions.parentElement !== headerActions.parentElement) {
        headerActions.parentElement.insertBefore(roomActions, headerActions);
      } else if (!zoomOn && roomActions.parentElement !== roomCard) {
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
