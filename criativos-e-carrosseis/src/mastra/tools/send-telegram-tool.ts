import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';

export const sendTelegramTool = createTool({
  id: 'send-telegram',
  description: 'Envia os slides e o copy para o Telegram para aprovação',
  inputSchema: z.object({
    slidePaths: z.array(z.string()),
    copyResume: z.string(),
    tema: z.string(),
  }),
  outputSchema: z.object({
    sent: z.boolean(),
  }),
  execute: async ({ context }) => {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
    const chatId = process.env.TELEGRAM_CHAT_ID!;
    const { slidePaths, copyResume, tema } = context;

    await bot.sendMessage(
      chatId,
      `🎨 *Carrossel gerado: ${tema}*\n\n${copyResume}\n\n---\nResponda com:\n✅ /aprovar — publicar agora\n✏️ /ajustar [instrução] — refazer o copy`,
      { parse_mode: 'Markdown' }
    );

    const existingPaths = slidePaths.filter(p => fs.existsSync(p));

    if (existingPaths.length > 0) {
      const media = existingPaths.map((p, i) => ({
        type: 'photo' as const,
        media: fs.createReadStream(p) as any,
        caption: i === 0 ? `Slides — ${tema}` : undefined,
      }));
      await bot.sendMediaGroup(chatId, media);
    }

    await bot.sendMessage(chatId, '👆 Responda /aprovar ou /ajustar [instrução]');

    return { sent: true };
  },
});
