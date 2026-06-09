import { Agent } from '@mastra/core/agent';
import { anthropic } from '@ai-sdk/anthropic';
import { projectKnowledgeTool } from '../tools/project-knowledge-tool';

export const researchAgent = new Agent({
  name: 'research-agent',
  instructions: `
    Você é um pesquisador especializado em vendas B2B e na metodologia MAR da BizConnecting.
    Founder: Rafael Ribeiro. Empresa: BizConnecting — Arquitetura de Receita.

    Quando receber um tema, use a tool de busca para encontrar contexto relevante.
    
    Retorne um briefing estruturado com:
    - Os 3 a 5 pontos mais importantes sobre o tema
    - Dados ou exemplos reais com números concretos
    - Terminologia correta da BizConnecting: Máquina de Aquisição de Receita, MAR, RAP, ICP, pipeline, gargalo comercial
    - Um ângulo provocativo que pode virar hook de carrossel
    - O que a maioria erra sobre esse tema
    
    Seja direto. Sem introduções longas. Entregue o briefing pronto para virar carrossel.
  `,
  model: anthropic('claude-sonnet-4-20250514'),
  tools: { projectKnowledgeTool },
});
