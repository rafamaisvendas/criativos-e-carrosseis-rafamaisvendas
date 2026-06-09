import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';

export const publishMetricoolTool = createTool({
  id: 'publish-metricool',
  description: 'Publica o carrossel no Instagram via Metricool',
  inputSchema: z.object({
    slidePaths: z.array(z.string()),
    caption: z.string(),
    scheduledAt: z.string().optional(),
  }),
  outputSchema: z.object({
    published: z.boolean(),
    postId: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { slidePaths, caption, scheduledAt } = context;
    const token = process.env.METRICOOL_USER_TOKEN!;
    const apiKey = process.env.METRICOOL_API_KEY!;

    const uploadedIds: string[] = [];

    for (const filePath of slidePaths) {
      if (!fs.existsSync(filePath)) continue;

      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString('base64');

      const uploadRes = await fetch('https://app.metricool.com/api/v2/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: base64, mimeType: 'image/png' }),
      });

      const uploadData = (await uploadRes.json()) as { id?: string };
      if (uploadData?.id) uploadedIds.push(uploadData.id);
    }

    const postPayload: Record<string, unknown> = {
      networks: ['instagram'],
      text: caption,
      mediaIds: uploadedIds,
      type: 'carousel',
    };

    if (scheduledAt) postPayload.scheduledAt = scheduledAt;

    const postRes = await fetch('https://app.metricool.com/api/v2/scheduler/post', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postPayload),
    });

    const postData = (await postRes.json()) as { id?: string };

    return {
      published: postRes.ok,
      postId: postData?.id,
      message: postRes.ok ? 'Carrossel publicado com sucesso' : `Erro: ${JSON.stringify(postData)}`,
    };
  },
});
