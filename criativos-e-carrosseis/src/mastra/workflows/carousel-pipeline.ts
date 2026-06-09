import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { researchAgent } from '../agents/research-agent';
import { copyAgent } from '../agents/copy-agent';
import { renderSlideTool } from '../tools/render-slide-tool';
import { sendTelegramTool } from '../tools/send-telegram-tool';
import { pollTelegramTool } from '../tools/poll-telegram-tool';
import { publishMetricoolTool } from '../tools/publish-metricool-tool';

const SlideSchema = z.object({
  slideNumber: z.number(),
  type: z.enum(['hook', 'body', 'stat', 'callout', 'list', 'tension', 'punchline', 'cta']),
  title: z.string(),
  body: z.string(),
});

// STEP 1 — Pesquisa
const stepPesquisa = createStep({
  id: 'pesquisa',
  inputSchema: z.object({ tema: z.string() }),
  outputSchema: z.object({ briefing: z.string(), tema: z.string() }),
  execute: async ({ inputData }) => {
    const result = await researchAgent.generate(
      `Pesquise sobre o tema: "${inputData.tema}"`
    );
    return { briefing: result.text, tema: inputData.tema };
  },
});

// STEP 2 — Geração de copy
const stepCopy = createStep({
  id: 'copy',
  inputSchema: z.object({
    briefing: z.string(),
    tema: z.string(),
    instruction: z.string().optional(),
  }),
  outputSchema: z.object({
    slides: z.array(SlideSchema),
    caption: z.string(),
    briefing: z.string(),
    tema: z.string(),
  }),
  execute: async ({ inputData }) => {
    const prompt = inputData.instruction
      ? `Briefing: ${inputData.briefing}\n\nAJUSTE SOLICITADO: ${inputData.instruction}\n\nGere os 7 slides com o ajuste aplicado.`
      : `Briefing: ${inputData.briefing}\n\nGere os 7 slides para o carrossel sobre "${inputData.tema}".`;

    const result = await copyAgent.generate(prompt);

    let parsed: { slides: typeof SlideSchema._type[]; caption: string };
    try {
      const clean = result.text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error(`Copy agent retornou JSON inválido: ${result.text.slice(0, 200)}`);
    }

    return {
      slides: parsed.slides,
      caption: parsed.caption,
      briefing: inputData.briefing,
      tema: inputData.tema,
    };
  },
});

// STEP 3 — Render dos slides
const stepRender = createStep({
  id: 'render',
  inputSchema: z.object({
    slides: z.array(SlideSchema),
    caption: z.string(),
    briefing: z.string(),
    tema: z.string(),
  }),
  outputSchema: z.object({
    slidePaths: z.array(z.string()),
    slides: z.array(SlideSchema),
    caption: z.string(),
    briefing: z.string(),
    tema: z.string(),
  }),
  execute: async ({ inputData }) => {
    const slidePaths: string[] = [];
    const totalSlides = inputData.slides.length;

    for (const slide of inputData.slides) {
      const result = await renderSlideTool.execute!({
        context: {
          slideNumber: slide.slideNumber,
          totalSlides,
          type: slide.type,
          title: slide.title,
          body: slide.body,
          outputDir: './output',
        },
        runId: '',
        threadId: '',
        resourceId: '',
        mastra: undefined as any,
      });
      if (result.success) slidePaths.push(result.filePath);
    }

    return {
      slidePaths,
      slides: inputData.slides,
      caption: inputData.caption,
      briefing: inputData.briefing,
      tema: inputData.tema,
    };
  },
});

// STEP 4 — Envio para Telegram e aguarda aprovação
const stepTelegram = createStep({
  id: 'telegram',
  inputSchema: z.object({
    slidePaths: z.array(z.string()),
    slides: z.array(SlideSchema),
    caption: z.string(),
    briefing: z.string(),
    tema: z.string(),
  }),
  outputSchema: z.object({
    decision: z.enum(['aprovar', 'ajustar']),
    instruction: z.string().optional(),
    slidePaths: z.array(z.string()),
    caption: z.string(),
    briefing: z.string(),
    tema: z.string(),
  }),
  execute: async ({ inputData }) => {
    const copyResume = inputData.slides
      .map(s => `*Slide ${String(s.slideNumber).padStart(2, '0')}:* ${s.title}`)
      .join('\n');

    await sendTelegramTool.execute!({
      context: { slidePaths: inputData.slidePaths, copyResume, tema: inputData.tema },
      runId: '', threadId: '', resourceId: '', mastra: undefined as any,
    });

    const approval = await pollTelegramTool.execute!({
      context: { timeoutMinutes: 30 },
      runId: '', threadId: '', resourceId: '', mastra: undefined as any,
    });

    return {
      decision: approval.decision,
      instruction: approval.instruction,
      slidePaths: inputData.slidePaths,
      caption: inputData.caption,
      briefing: inputData.briefing,
      tema: inputData.tema,
    };
  },
});

// STEP 5 — Publicação ou loop de ajuste
const stepPublicar = createStep({
  id: 'publicar',
  inputSchema: z.object({
    decision: z.enum(['aprovar', 'ajustar']),
    instruction: z.string().optional(),
    slidePaths: z.array(z.string()),
    caption: z.string(),
    briefing: z.string(),
    tema: z.string(),
  }),
  outputSchema: z.object({
    status: z.string(),
    message: z.string(),
    instruction: z.string().optional(),
    briefing: z.string().optional(),
    tema: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    if (inputData.decision === 'ajustar') {
      return {
        status: 'ajuste_solicitado',
        message: inputData.instruction ?? 'Ajuste sem instrução',
        instruction: inputData.instruction,
        briefing: inputData.briefing,
        tema: inputData.tema,
      };
    }

    const result = await publishMetricoolTool.execute!({
      context: { slidePaths: inputData.slidePaths, caption: inputData.caption },
      runId: '', threadId: '', resourceId: '', mastra: undefined as any,
    });

    return {
      status: result.published ? 'publicado' : 'erro',
      message: result.message,
    };
  },
});

// WORKFLOW PRINCIPAL
export const carouselPipeline = createWorkflow({
  id: 'carousel-pipeline',
  inputSchema: z.object({ tema: z.string() }),
  outputSchema: z.object({ status: z.string(), message: z.string() }),
})
  .then(stepPesquisa)
  .then(stepCopy)
  .then(stepRender)
  .then(stepTelegram)
  .then(stepPublicar)
  .commit();
