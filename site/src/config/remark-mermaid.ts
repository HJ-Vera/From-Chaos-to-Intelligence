/**
 * remark-mermaid.ts
 *
 * Remark plugin: turns ```` ```mermaid ```` fenced code blocks into
 * `<div class="mermaid">…</div>` so the browser can render them client-side.
 *
 * Runs at the remark (mdast) stage, before rehype — so expressive-code never
 * sees the block as code to syntax-highlight. No external deps: walks the tree
 * by hand to avoid pulling in unist-util-visit.
 */

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function remarkMermaid() {
  return (tree: any) => {
    const walk = (node: any) => {
      const children = node?.children;
      if (!Array.isArray(children)) return;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child?.type === 'code' && child.lang === 'mermaid') {
          children[i] = {
            type: 'html',
            value: `<div class="mermaid">${escapeHtml(String(child.value ?? ''))}</div>`,
          };
        } else {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}
