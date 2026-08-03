// Rendered-diagram pan/zoom plus a one-time mermaid initializer. `mermaid` is
// bundled from npm (see web/package.json), but this whole module is reached
// only through a dynamic import (see markdown.ts), so Vite emits it - and the
// heavy mermaid library it pulls in - as its own chunk that is fetched the
// first time a rendered document actually contains a ```mermaid block. A plain
// visit never downloads it.
import mermaid from "mermaid";

let initialized = false;
let mermaidSeq = 0;

function ensureMermaid(): typeof mermaid {
  if (!initialized) {
    const dark = !window.matchMedia("(prefers-color-scheme: light)").matches;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: dark ? "dark" : "default",
    });
    initialized = true;
  }
  return mermaid;
}

// Attach pan/zoom controls to a rendered mermaid figure. The +/- buttons zoom
// from the diagram's centre; Ctrl/Cmd + wheel zooms toward the pointer (plain
// wheel still scrolls the page); drag pans once zoomed in. Reset returns to the
// fit-to-width view.
function setupMermaidZoom(fig: HTMLElement): void {
  const svg = fig.querySelector<SVGSVGElement>("svg");
  if (!svg) {
    return;
  }

  const MIN = 1;
  const MAX = 6;
  let scale = 1;
  let tx = 0;
  let ty = 0;

  // Mermaid sets an inline max-width to the diagram's natural width, which can
  // overflow the container. Pin it to the container so the rest state fits and
  // zoom scales up from a fit-to-width baseline.
  svg.style.maxWidth = "100%";
  svg.style.transformOrigin = "0 0";
  svg.style.transition = "transform 0.08s ease-out";

  // Keep at least a sliver of the diagram inside the viewport after panning.
  const clampPan = () => {
    const f = fig.getBoundingClientRect();
    const r = svg.getBoundingClientRect();
    const margin = 48;
    if (r.right < f.left + margin) {
      tx += f.left + margin - r.right;
    }
    if (r.left > f.right - margin) {
      tx -= r.left - (f.right - margin);
    }
    if (r.bottom < f.top + margin) {
      ty += f.top + margin - r.bottom;
    }
    if (r.top > f.bottom - margin) {
      ty -= r.top - (f.bottom - margin);
    }
  };

  const apply = () => {
    svg.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    fig.classList.toggle("is-zoomed", scale > 1.001);
  };

  // Zoom by `factor`, anchoring the client point (mx,my) so it stays put.
  const zoomAt = (factor: number, mx: number, my: number) => {
    const next = Math.min(MAX, Math.max(MIN, scale * factor));
    if (next === scale) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    const ratio = next / scale;
    tx -= (mx - rect.left) * (ratio - 1);
    ty -= (my - rect.top) * (ratio - 1);
    scale = next;
    clampPan();
    apply();
  };

  const zoomCentre = (factor: number) => {
    const f = fig.getBoundingClientRect();
    zoomAt(factor, f.left + f.width / 2, f.top + f.height / 2);
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  };

  const bar = document.createElement("div");
  bar.className = "mermaid-zoom";
  const addBtn = (label: string, title: string, fn: () => void) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mermaid-zoom-btn";
    b.textContent = label;
    b.title = title;
    b.setAttribute("aria-label", title);
    b.addEventListener("click", fn);
    bar.appendChild(b);
  };
  addBtn("−", "Zoom out", () => zoomCentre(1 / 1.3));
  addBtn("↺", "Reset zoom", reset);
  addBtn("+", "Zoom in", () => zoomCentre(1.3));
  fig.appendChild(bar);

  fig.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY);
    },
    { passive: false },
  );

  // Drag to pan, but only once zoomed in.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  fig.addEventListener("pointerdown", (event) => {
    if (scale <= 1.001 || event.button !== 0) {
      return;
    }
    if ((event.target as Element).closest(".mermaid-zoom")) {
      return;
    }
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    fig.classList.add("is-panning");
    svg.style.transition = "none";
    fig.setPointerCapture?.(event.pointerId);
  });

  fig.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }
    tx += event.clientX - lastX;
    ty += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    clampPan();
    apply();
  });

  const endDrag = (event: PointerEvent) => {
    if (!dragging) {
      return;
    }
    dragging = false;
    fig.classList.remove("is-panning");
    svg.style.transition = "transform 0.08s ease-out";
    if (fig.releasePointerCapture && event.pointerId != null) {
      try {
        fig.releasePointerCapture(event.pointerId);
      } catch {
        /* pointer already released */
      }
    }
  };
  fig.addEventListener("pointerup", endDrag);
  fig.addEventListener("pointercancel", endDrag);
}

// Replace each rendered ```mermaid code block in `root` with an SVG diagram.
// On any failure the original code block is left untouched.
export function renderMermaid(root: ParentNode): void {
  const blocks = root.querySelectorAll<HTMLElement>("pre > code.language-mermaid");
  if (!blocks.length) {
    return;
  }
  const m = ensureMermaid();
  blocks.forEach((code) => {
    const pre = code.parentNode as HTMLElement | null;
    if (!pre || pre.dataset.mermaidDone) {
      return;
    }
    pre.dataset.mermaidDone = "1";
    const id = "mmd-" + mermaidSeq++;
    m.render(id, code.textContent || "")
      .then((out) => {
        const fig = document.createElement("div");
        fig.className = "mermaid-rendered";
        fig.innerHTML = out.svg;
        pre.parentNode!.replaceChild(fig, pre);
        setupMermaidZoom(fig);
      })
      .catch(() => {
        /* leave the fenced code block as-is */
      });
  });
}
