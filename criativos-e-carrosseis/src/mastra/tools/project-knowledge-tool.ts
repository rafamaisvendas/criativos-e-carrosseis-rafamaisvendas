import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const projectKnowledgeTool = createTool({
  id: 'project-knowledge-search',
  description: 'Busca contexto relevante sobre um tema no project knowledge da BizConnecting',
  inputSchema: z.object({
    query: z.string().describe('Tema para buscar no project knowledge'),
  }),
  outputSchema: z.object({
    context: z.string(),
  }),
  execute: async ({ context }) => {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Você é um pesquisador especializado em vendas B2B e na metodologia MAR da BizConnecting.
Use o project knowledge disponível para encontrar os pontos mais relevantes sobre o tema.
Retorne um briefing estruturado com dados, frameworks e exemplos reais encontrados.`,
      messages: [
        {
          role: 'user',
          content: `Pesquise sobre: "${context.query}". 
Foco em: dados concretos, exemplos reais, terminologia BizConnecting (MAR, RAP, ICP, pipeline), 
e ângulos provocativos que podem virar hook de carrossel para Instagram.`,
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n');

    return { context: text || 'Nenhum contexto encontrado.' };
  },
});
