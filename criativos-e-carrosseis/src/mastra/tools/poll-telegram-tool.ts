import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import TelegramBot from 'node-telegram-bot-api';

export const pollTelegramTool = createTool({
  id: 'poll-telegram',
  description: 'Aguarda resposta de aprovação ou ajuste no Telegram',
  inputSchema: z.object({
    timeoutMinutes: z.number().default(30),
  }),
  outputSchema: z.object({
    decision: z.enum(['aprovar', 'ajustar']),
    instruction: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { timeoutMinutes } = context;

    return new Promise<{ decision: 'aprovar' | 'ajustar'; instruction?: string }>((resolve, reject) => {
      const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });
      const chatId = process.env.TELEGRAM_CHAT_ID!;

      const timeout = setTimeout(() => {
        bot.stopPolling();
        reject(new Error(`Timeout: sem resposta em ${timeoutMinutes} minutos`));
      }, timeoutMinutes * 60 * 1000);

      bot.onText(/\/aprovar/, (msg) => {
        if (String(msg.chat.id) === chatId) {
          clearTimeout(timeout);
          bot.stopPolling();
          resolve({ decision: 'aprovar' });
        }
      });

      bot.onText(/\/ajustar (.+)/, (msg, match) => {
        if (String(msg.chat.id) === chatId) {
          clearTimeout(timeout);
          bot.stopPolling();
          resolve({ decision: 'ajustar', instruction: match?.[1] ?? '' });
        }
      });
    });
  },
});
