// TDD Extension landing page. Progressive enhancement only: the page
// is fully readable and styled (via the linked stylesheet) without JavaScript.
// This module entry wires up the optional interactive behaviours. It is a
// deferred ES module, so the DOM is parsed before it runs.
import { setupNav } from "./nav";
import { setupClipboard } from "./clipboard";
import { setupTabs } from "./tabs";
import { setupMarkdown } from "./markdown";

setupNav();
setupClipboard();
setupTabs();
setupMarkdown();
