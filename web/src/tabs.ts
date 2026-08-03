// Tabs (install methods, example outputs). Each tab carries aria-controls
// pointing at its panel. Tabs in the same [role="tablist"] form one group;
// activating one hides its siblings.
export function setupTabs(): void {
  document.querySelectorAll<HTMLElement>('[role="tablist"]').forEach((list) => {
    const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));

    const panelFor = (tab: HTMLElement) =>
      document.getElementById(tab.getAttribute("aria-controls") || "");

    const activate = (tab: HTMLElement) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.classList.toggle("is-active", selected);
        t.setAttribute("aria-selected", String(selected));
        const panel = panelFor(t);
        if (panel) {
          panel.classList.toggle("is-active", selected);
          if (selected) {
            panel.removeAttribute("hidden");
          } else {
            panel.setAttribute("hidden", "");
          }
        }
      });
    };

    list.addEventListener("click", (event) => {
      const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');
      if (tab) {
        activate(tab);
      }
    });

    // Left/right arrow keys move between tabs, matching the ARIA pattern.
    list.addEventListener("keydown", (event) => {
      const current = tabs.indexOf(document.activeElement as HTMLElement);
      if (current === -1) {
        return;
      }
      let next: HTMLElement | null = null;
      if (event.key === "ArrowRight") {
        next = tabs[(current + 1) % tabs.length];
      } else if (event.key === "ArrowLeft") {
        next = tabs[(current - 1 + tabs.length) % tabs.length];
      }
      if (next) {
        event.preventDefault();
        next.focus();
        activate(next);
      }
    });
  });
}
