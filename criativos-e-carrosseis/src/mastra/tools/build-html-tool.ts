import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export type SlideType = 'hook' | 'body' | 'stat' | 'callout' | 'list' | 'tension' | 'punchline' | 'cta';

function buildSlideHtml(slide: {
  slideNumber: number;
  totalSlides: number;
  type: SlideType;
  title: string;
  body: string;
}): string {
  const { slideNumber, totalSlides, type, title, body } = slide;
  const num = String(slideNumber).padStart(2, '0');
  const total = String(totalSlides).padStart(2, '0');

  const buildBody = () => {
    switch (type) {
      case 'hook':
        return `
          <div class="accent-bar-left"></div>
          <h1 class="headline hook-title">${title}</h1>
          <p class="body-support">${body}</p>
        `;

      case 'body':
        return `
          <h2 class="section-title">${title}</h2>
          <div class="divider"></div>
          ${body.split('\n').filter(Boolean).map(p => `<p class="body-text">${p}</p>`).join('')}
        `;

      case 'stat': {
        const parts = body.split('|||');
        const before = parts[0]?.trim() ?? '';
        const after = parts[1]?.trim() ?? '';
        const [numBefore, ...labelBefore] = before.split(' ');
        const [numAfter, ...labelAfter] = after.split(' ');
        return `
          <h2 class="section-title">${title}</h2>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-label">SEM ROTINA</div>
              <div class="stat-number">${numBefore}</div>
              <div class="stat-desc">${labelBefore.join(' ')}</div>
            </div>
            <div class="stat-card stat-card--accent">
              <div class="stat-label stat-label--accent">COM ROTINA</div>
              <div class="stat-number stat-number--accent">${numAfter}</div>
              <div class="stat-desc">${labelAfter.join(' ')}</div>
            </div>
          </div>
        `;
      }

      case 'callout':
        return `
          <h2 class="section-title">${title}</h2>
          <div class="callout-block">
            <p class="callout-text">${body}</p>
          </div>
        `;

      case 'list': {
        const items = body.split('\n').filter(Boolean);
        return `
          <h2 class="section-title">${title}</h2>
          <div class="list-block">
            ${items.map(item => {
              const [tag, ...rest] = item.split('—');
              return `
                <div class="list-item">
                  <span class="list-arrow">→</span>
                  <div class="list-content">
                    ${tag && rest.length > 0
                      ? `<span class="list-tag">${tag.trim()}</span><span class="list-text">${rest.join('—').trim()}</span>`
                      : `<span class="list-text">${item}</span>`
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      case 'tension':
        return `
          <h2 class="section-title tension-title">${title}</h2>
          <div class="divider"></div>
          ${body.split('\n').filter(Boolean).map(p => `<p class="body-text">${p}</p>`).join('')}
        `;

      case 'punchline':
        return `
          <div class="punchline-wrap">
            <p class="punchline-text">${title}</p>
            <p class="punchline-text">${body.split('\n')[0] ?? ''}</p>
            <div class="divider"></div>
            ${body.split('\n').slice(1).filter(Boolean).map(p => `<p class="body-text accent-text">${p}</p>`).join('')}
          </div>
        `;

      case 'cta':
        return `
          <h2 class="section-title">${title}</h2>
          <p class="body-text">${body.split('\n')[0] ?? ''}</p>
          <div class="cta-box">
            <p class="cta-text">${body.split('\n')[1] ?? ''}</p>
          </div>
          <p class="body-text body-text--secondary">${body.split('\n')[2] ?? ''}</p>
        `;

      default:
        return `<h2 class="section-title">${title}</h2><p class="body-text">${body}</p>`;
    }
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800&family=Playfair+Display:ital,wght@1,400;1,700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0D0D0D;
    --surface: #161616;
    --border: #2A2A2A;
    --text-primary: #F0F0F0;
    --text-secondary: #9A9A9A;
    --accent: #E55A1C;
    --accent-muted: rgba(229, 90, 28, 0.10);
    --margin-h: 72px;
    --margin-v: 64px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1080px;
    height: 1080px;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    padding: var(--margin-v) var(--margin-h);
    overflow: hidden;
  }

  /* ZONA SUPERIOR */
  .slide-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    margin-bottom: 48px;
  }

  .slide-num {
    font-size: 14px;
    font-weight: 400;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
  }

  /* ZONA CENTRAL */
  .slide-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
  }

  /* TIPOGRAFIA */
  .headline {
    font-size: 64px;
    font-weight: 800;
    line-height: 1.0;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin-bottom: 28px;
  }

  .hook-title {
    font-size: 60px;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .section-title {
    font-size: 44px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin-bottom: 32px;
  }

  .tension-title {
    font-size: 40px;
  }

  .body-text {
    font-size: 22px;
    font-weight: 300;
    line-height: 1.6;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .body-text--secondary {
    color: var(--text-secondary);
    font-size: 18px;
  }

  .accent-text {
    color: var(--accent);
    font-weight: 400;
  }

  .body-support {
    font-size: 22px;
    font-weight: 300;
    line-height: 1.6;
    color: var(--text-secondary);
    margin-top: 8px;
  }

  /* ACENTO */
  .accent-bar-left {
    position: absolute;
    left: -24px;
    top: 0;
    width: 4px;
    height: 100%;
    max-height: 200px;
    background: var(--accent);
    border-radius: 2px;
  }

  em {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    color: var(--accent);
    font-weight: 400;
  }

  /* DIVISOR */
  .divider {
    width: 100%;
    height: 1px;
    background: var(--border);
    margin: 24px 0;
  }

  /* STAT GRID */
  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 8px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 28px 24px;
  }

  .stat-card--accent {
    border-color: rgba(229, 90, 28, 0.25);
  }

  .stat-label {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .stat-label--accent { color: var(--accent); }

  .stat-number {
    font-size: 80px;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.0;
    letter-spacing: -0.02em;
  }

  .stat-number--accent { color: var(--accent); }

  .stat-desc {
    font-size: 14px;
    font-weight: 300;
    color: var(--text-secondary);
    margin-top: 12px;
    line-height: 1.5;
  }

  /* CALLOUT */
  .callout-block {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    padding: 28px 32px;
    margin: 8px 0;
  }

  .callout-text {
    font-size: 22px;
    font-weight: 300;
    color: var(--text-primary);
    line-height: 1.6;
  }

  /* LISTA */
  .list-block {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .list-item {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    padding: 18px 0;
    border-bottom: 1px solid var(--border);
  }

  .list-item:last-child { border-bottom: none; }

  .list-arrow {
    font-size: 18px;
    color: var(--accent);
    font-weight: 400;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .list-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .list-tag {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.07em;
    color: var(--accent);
    text-transform: uppercase;
    background: var(--accent-muted);
    border: 1px solid rgba(229, 90, 28, 0.2);
    padding: 3px 10px;
    display: inline-block;
    margin-bottom: 6px;
  }

  .list-text {
    font-size: 18px;
    font-weight: 300;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  /* PUNCHLINE */
  .punchline-wrap {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .punchline-text {
    font-size: 40px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin-bottom: 16px;
  }

  /* CTA */
  .cta-box {
    border: 1px solid var(--accent);
    background: var(--accent-muted);
    padding: 20px 28px;
    margin: 20px 0;
  }

  .cta-text {
    font-size: 20px;
    font-weight: 400;
    color: var(--text-primary);
    line-height: 1.5;
  }

  /* ZONA INFERIOR */
  .slide-footer {
    height: 48px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 32px;
  }

  .sig {
    font-size: 13px;
    font-weight: 300;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
  }

  .sig strong {
    font-weight: 500;
    color: rgba(240, 240, 240, 0.5);
  }
</style>
</head>
<body>
  <div class="slide-top">
    <span class="slide-num">${num}</span>
  </div>

  <div class="slide-body">
    ${buildBody()}
  </div>

  <div class="slide-footer">
    <span class="sig"><strong>BizConnecting</strong> | Arquitetura de Receita</span>
    <span class="sig">${num} / ${total}</span>
  </div>
</body>
</html>`;
}

export const buildHtmlTool = createTool({
  id: 'build-html',
  description: 'Monta HTML de um slide seguindo o design system BizConnecting para carrosseis',
  inputSchema: z.object({
    slideNumber: z.number(),
    totalSlides: z.number(),
    type: z.enum(['hook', 'body', 'stat', 'callout', 'list', 'tension', 'punchline', 'cta']),
    title: z.string(),
    body: z.string().describe('Corpo do slide. Para stat: separar os dois valores com ||| ex: "22 tentativas por dia|||47 tentativas por dia"'),
  }),
  outputSchema: z.object({
    html: z.string(),
  }),
  execute: async ({ context }) => {
    const html = buildSlideHtml(context as any);
    return { html };
  },
});
