import { Avatar, colorFor } from "./Avatar.js";
import { LiveBadge } from "./Badge.js";
import { Icon } from "./icons.js";
import { T } from "../strings.js";

export function renderMemberSidebar(container, {
  members, liveMembers, watching, online, mePub, hostPub, onWatch, onStop
} = {}) {
  container.replaceChildren();

  const title = document.createElement("div");
  title.className = "section-label";
  title.textContent = T.room.members;
  title.style.margin = "4px 0 8px";
  container.appendChild(title);

  for (const [pub, name] of members) {
    const isMe = pub === mePub;
    const isLive = liveMembers.has(pub);
    const isWatching = watching.has(pub);

    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "flex", alignItems: "center", gap: "8px",
      padding: "6px 6px", borderRadius: "var(--radius-sm)",
      background: isWatching ? "var(--secondary)" : "transparent"
    });

    const av = Avatar({ initial: name[0] || "?", color: colorFor(pub || name), size: 28 });
    av.style.flex = "0 0 auto";

    const label = document.createElement("div");
    label.textContent = isMe ? T.room.you(name) : name;
    Object.assign(label.style, {
      flex: "1", minWidth: "0", fontSize: "13px", fontWeight: "500", color: "var(--fg)",
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      opacity: isMe || online.has(pub) ? "1" : ".45"
    });

    row.append(av, label);

    if (pub === hostPub) {
      const crown = Icon("crown", { size: 13 });
      crown.style.color = "var(--muted-fg)";
      crown.style.flex = "0 0 auto";
      row.appendChild(crown);
    }

    if (isLive) {
      row.appendChild(LiveBadge());
      if (!isMe) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.title = isWatching ? T.room.stopWatching : T.room.watch;
        btn.appendChild(Icon(isWatching ? "log-out" : "eye", { size: 14 }));
        Object.assign(btn.style, {
          display: "grid", placeItems: "center", width: "26px", height: "26px", padding: "0",
          flex: "0 0 auto", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
          background: "transparent", color: isWatching ? "var(--blue)" : "var(--muted-fg)",
          cursor: "pointer"
        });
        btn.onmouseenter = () => { btn.style.color = "var(--fg)"; };
        btn.onmouseleave = () => { btn.style.color = isWatching ? "var(--blue)" : "var(--muted-fg)"; };
        btn.onclick = () => (isWatching ? onStop(pub) : onWatch(pub));
        row.appendChild(btn);
      }
    }

    container.appendChild(row);
  }
}
