// Mobile navigation toggle.
export function setupNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) {
    return;
  }

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // Close the menu after following an in-page link.
  links.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}
