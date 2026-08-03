// Markdown rendering for the example excerpts and the full-file viewer.
// `marked` is bundled from npm (see web/package.json). Parsing is forced
// synchronous (`async: false`) so the rendered HTML is available immediately.
import { marked } from "marked";
import DOMPurify from "dompurify";

const GH_BLOB = "https://github.com/d0whc3r/spec-kit-tdd/blob/main/";

// Sanitize at the single render chokepoint so every innerHTML sink (excerpts
// and the full-file modal) is covered. Inputs are first-party today; this is
// defense in depth so the renderer stays safe if it is ever fed untrusted
// markdown. DOMPurify keeps the `class` attribute, so `code.language-mermaid`
// survives for renderMermaidIn() below.
const render = (text: string): string =>
  DOMPurify.sanitize(marked.parse(text, { async: false, gfm: true, breaks: false }));

// Pull in the mermaid pan/zoom chunk only when a rendered document actually
// contains a diagram, so a plain visit never downloads it.
function renderMermaidIn(root: ParentNode): void {
  if (!root.querySelector("pre > code.language-mermaid")) {
    return;
  }
  import("./mermaid")
    .then((m) => m.renderMermaid(root))
    .catch(() => {
      /* mermaid chunk unavailable: code blocks stay as plain text */
    });
}

export function setupMarkdown(): void {
  // Upgrade each excerpt <pre class="md-source"> to rendered markdown.
  document.querySelectorAll<HTMLElement>("pre.md-source").forEach((pre) => {
    const code = pre.querySelector("code");
    const raw = (code ? code.textContent : pre.textContent) || "";
    const view = document.createElement("div");
    view.className = "md-body md-excerpt";
    view.innerHTML = render(raw);
    pre.parentNode!.insertBefore(view, pre);
    pre.hidden = true;
    renderMermaidIn(view);
  });

  // Full-file viewer modal.
  const modal = document.getElementById("md-modal");
  const modalBody = document.getElementById("md-modal-body");
  const modalTitle = document.getElementById("md-modal-title");
  const modalGh = document.getElementById("md-modal-gh") as HTMLAnchorElement | null;
  let lastFocused: HTMLElement | null = null;
  const cache: Record<string, string> = {};

  const closeModal = () => {
    if (!modal) {
      return;
    }
    modal.hidden = true;
    document.body.classList.remove("md-modal-open");
    lastFocused?.focus?.();
  };

  const openModal = (path: string, title: string | null) => {
    if (!modal || !modalBody || !modalTitle || !modalGh) {
      return;
    }
    lastFocused = document.activeElement as HTMLElement;
    modalTitle.textContent = title || path;
    modalGh.href = GH_BLOB + path;
    modal.hidden = false;
    document.body.classList.add("md-modal-open");
    modalBody.focus();

    const show = (html: string) => {
      modalBody.innerHTML = html;
      modalBody.scrollTop = 0;
      renderMermaidIn(modalBody);
    };

    if (cache[path]) {
      show(cache[path]);
      return;
    }

    show('<p class="md-loading">Loading&hellip;</p>');
    fetch(path)
      .then((res) => {
        if (!res.ok) {
          throw new Error(String(res.status));
        }
        return res.text();
      })
      .then((text) => {
        cache[path] = render(text);
        show(cache[path]);
      })
      .catch(() => {
        modalBody.innerHTML =
          '<p class="md-loading">Could not load this file. ' +
          '<a href="' +
          GH_BLOB +
          path +
          '" target="_blank" rel="noopener">Open it on GitHub</a> instead.</p>';
      });
  };

  document.querySelectorAll<HTMLElement>(".md-full-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const path = btn.getAttribute("data-md-full");
      const title = btn.getAttribute("data-md-title");
      if (!path) {
        return;
      }
      openModal(path, title);
    });
  });

  if (modal) {
    modal.addEventListener("click", (event) => {
      if ((event.target as Element).closest("[data-md-close]")) {
        closeModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });
  }
}
