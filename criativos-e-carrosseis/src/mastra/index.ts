import 'dotenv/config';
import { Mastra } from '@mastra/core';
import { researchAgent } from './agents/research-agent';
import { copyAgent } from './agents/copy-agent';
import { carouselPipeline } from './workflows/carousel-pipeline';

export const mastra = new Mastra({
  agents: { researchAgent, copyAgent },
  workflows: { carouselPipeline },
});
