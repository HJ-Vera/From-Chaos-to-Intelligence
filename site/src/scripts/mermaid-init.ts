/**
 * mermaid-init.ts
 *
 * Renders ```mermaid diagrams client-side. Loaded only on post pages (via
 * PostLayout). Mermaid itself is imported dynamically, so the library only
 * downloads when a page actually contains a diagram.
 *
 * Follows the site's `data-theme` attribute on <html> and re-renders when the
 * reader toggles light/dark, so diagram colors stay in sync with the theme.
 */

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  run: (opts: { nodes: HTMLElement[] }) => Promise<void>;
};

const themeForMermaid = (): 'dark' | 'default' =>
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';

export async function renderMermaid(): Promise<void> {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.mermaid'));
  if (nodes.length === 0) return;

  // Remember the original source so we can re-render on theme change.
  for (const node of nodes) {
    if (!node.dataset.source) node.dataset.source = node.textContent ?? '';
  }

  const { default: mermaid } = await import('mermaid');
  const api = mermaid as unknown as MermaidApi;

  const draw = async () => {
    api.initialize({
      startOnLoad: false,
      theme: themeForMermaid(),
      securityLevel: 'loose',
    });
    for (const node of nodes) {
      node.removeAttribute('data-processed');
      node.innerHTML = node.dataset.source ?? '';
    }
    await api.run({ nodes });
  };

  await draw();

  new MutationObserver(() => {
    void draw();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}
