// Copy-to-clipboard: one button per <pre data-copy>. The button is injected so
// the markup stays clean and works without JS.

// Fallback copy for browsers without the async Clipboard API, or when it is
// denied (non-secure context, permissions). Returns true only if the copy
// actually happened. execCommand is deprecated but remains the standard
// no-dependency fallback for graceful degradation.
function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function setupClipboard(): void {
  document.querySelectorAll<HTMLPreElement>("pre[data-copy]").forEach((pre) => {
    const wrap = document.createElement("div");
    wrap.className = "pre-wrap";
    pre.parentNode!.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pre-copy";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    wrap.appendChild(btn);

    // Show a transient label, then revert. `copied` toggles the success styling
    // so the failure hint never appears as a success.
    const flash = (label: string, copied: boolean) => {
      btn.textContent = label;
      btn.classList.toggle("is-copied", copied);
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("is-copied");
      }, 1500);
    };
    const succeed = () => flash("Copied", true);
    const failHint = () => flash("Copy failed", false);

    btn.addEventListener("click", () => {
      const code = pre.querySelector("code");
      const text = (code ? code.innerText : pre.innerText) || "";

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(succeed, () => {
          if (legacyCopy(text)) succeed();
          else failHint();
        });
      } else if (legacyCopy(text)) {
        succeed();
      } else {
        failHint();
      }
    });
  });
}
