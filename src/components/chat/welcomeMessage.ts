import type { ChatMessageData } from './MessageBubble';

/**
 * Static greeting shown at the top of every chat. Display-only: it is never
 * stored, never sent to Gemini as history, and has no Copy/Save/Go deeper.
 */
export const WELCOME_MESSAGE: ChatMessageData = {
  id: 'initial',
  role: 'assistant',
  content: `## Welcome, I'm Jyotish AI

Namaste, and welcome. I'm here to help you explore your birth chart through the lens of Vedic astrology, clearly and at your own pace.

**You can ask me about:**

- Your **Lagna**, Moon sign and the planets that shape your nature
- The **yogas** in your chart and how they show up in daily life
- **Current transits** and what this period is highlighting for you
- **Timing**: dashas, openings, and when to act or wait

> Choose **In-depth** below for a longer, report-style answer, or tap **Go deeper** on any reply.

What would you like to explore first?`,
};
