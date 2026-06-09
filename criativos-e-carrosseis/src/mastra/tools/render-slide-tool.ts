import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { buildHtmlTool } from './build-html-tool';

export const renderSlideTool = createTool({
  id: 'render-slide',
  description: 'Renderiza um slide em PNG 1080x1080 usando Puppeteer',
  inputSchema: z.object({
    slideNumber: z.number(),
    totalSlides: z.number(),
    type: z.enum(['hook', 'body', 'stat', 'callout', 'list', 'tension', 'punchline', 'cta']),
    title: z.string(),
    body: z.string(),
    outputDir: z.string().default('./output'),
  }),
  outputSchema: z.object({
    filePath: z.string(),
    success: z.boolean(),
  }),
  execute: async ({ context }) => {
    const { slideNumber, totalSlides, type, title, body, outputDir } = context;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlResult = await buildHtmlTool.execute!({
      context: { slideNumber, totalSlides, type, title, body },
      runId: '',
      threadId: '',
      resourceId: '',
      mastra: undefined as any,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
      await page.setContent(htmlResult.html, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 1000));

      const fileName = `slide-${String(slideNumber).padStart(2, '0')}.png`;
      const filePath = path.join(outputDir, fileName);
      await page.screenshot({ path: filePath as `${string}.png`, fullPage: false });

      return { filePath, success: true };
    } finally {
      await browser.close();
    }
  },
});
