/**
 * mermaid-init.ts
 *
 * Renders ```mermaid diagrams client-side. Loaded only on post pages (via
 * PostLayout). Mermaid itself is imported dynamically, so the library only
 * downloads when a page actually contains a diagram.
 *
 * Uses a neutral light diagram theme so nodes and connectors remain consistent
 * across the site's light and dark appearances.
 */

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  run: (opts: { nodes: HTMLElement[] }) => Promise<void>;
};

const diagramThemeVariables = {
  background: '#ffffff',
  primaryColor: '#f2f3f5',
  primaryTextColor: '#111827',
  primaryBorderColor: '#111827',
  secondaryColor: '#f2f3f5',
  secondaryTextColor: '#111827',
  secondaryBorderColor: '#111827',
  tertiaryColor: '#f2f3f5',
  tertiaryTextColor: '#111827',
  tertiaryBorderColor: '#111827',
  lineColor: '#111827',
  textColor: '#111827',
  edgeLabelBackground: '#ffffff',
  clusterBkg: '#f2f3f5',
  clusterBorder: '#111827',
};

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
      theme: 'base',
      themeVariables: diagramThemeVariables,
      securityLevel: 'loose',
    });
    for (const node of nodes) {
      node.removeAttribute('data-processed');
      node.innerHTML = node.dataset.source ?? '';
    }
    await api.run({ nodes });
  };

  await draw();
}
