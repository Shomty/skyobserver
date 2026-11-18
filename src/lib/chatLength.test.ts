import { describe, expect, it } from 'vitest';
import { buildChatContents, CHAT_LENGTH_CONFIG, goDeeperLabel, isChatLength } from './chatLength';
import { buildCurrentSkyBlock, buildStableSystemInstruction, type ChatContextProps } from './chatUtils';
import { findGoDeeperTarget } from '../services/chatReplyService';

const history = [
  { role: 'user', content: 'What is my lagna?' },
  { role: 'assistant', content: 'Your lagna is Leo.' },
];

function ctxAt(iso: string): ChatContextProps {
  return {
    userProfile: { name: 'Test' },
    referenceDate: new Date(iso),
    locationLabel: 'Belgrade',
    transitPositions: [],
    birthPositions: null,
    birthYogas: [{ name: 'Gaja Kesari', description: 'Moon-Jupiter', planets: ['Moon', 'Jupiter'] }] as never,
    yogas: [{ name: 'TransitYogaX', description: 'now' }] as never,
    transits: [],
    birthPanchang: null,
    panchang: null,
  };
}

describe('buildChatContents', () => {
  it('sends history verbatim and puts the current sky and question in the last turn only', () => {
    const contents = buildChatContents(history, 'And my moon?', 'SKY-BLOCK', 'standard');
    expect(contents).toHaveLength(3);
    expect(contents[0]).toEqual({ role: 'user', parts: [{ text: 'What is my lagna?' }] });
    expect(contents[1]).toEqual({ role: 'model', parts: [{ text: 'Your lagna is Leo.' }] });
    const last = contents[2].parts[0].text;
    expect(last).toContain('<current_sky>\nSKY-BLOCK\n</current_sky>');
    expect(last).toContain('<question>\nAnd my moon?\n</question>');
    expect(last).not.toContain('RESPONSE LENGTH');
  });

  it('adds the in-depth directive to the last turn without changing the shared prefix', () => {
    const standard = buildChatContents(history, 'Q', 'SKY', 'standard');
    const deep = buildChatContents(history, 'Q', 'SKY', 'in_depth');
    expect(deep.slice(0, -1)).toEqual(standard.slice(0, -1));
    expect(deep.at(-1)!.parts[0].text).toContain(CHAT_LENGTH_CONFIG.in_depth.directive);
  });
});

describe('length config', () => {
  it('keeps Standard identical to the old request: no budget override, no directive', () => {
    expect(CHAT_LENGTH_CONFIG.standard.maxOutputTokens).toBeUndefined();
    expect(CHAT_LENGTH_CONFIG.standard.directive).toBe('');
    expect(CHAT_LENGTH_CONFIG.in_depth.maxOutputTokens).toBeGreaterThan(8192);
  });

  it('validates stored values', () => {
    expect(isChatLength('in_depth')).toBe(true);
    expect(isChatLength('long')).toBe(false);
    expect(isChatLength(null)).toBe(false);
  });
});

describe('system prompt split', () => {
  it('keeps the system instruction free of anything time-dependent', () => {
    const a = buildStableSystemInstruction(ctxAt('2026-11-18T08:00:00.000Z'));
    const b = buildStableSystemInstruction(ctxAt('2026-11-19T21:13:07.123Z'));
    expect(a).toBe(b);
    expect(a).toContain('Gaja Kesari');
    expect(a).not.toContain('TransitYogaX');
    expect(a).not.toContain('2026-11-18');
  });

  it('puts the reference moment and transits in the current-sky block', () => {
    const sky = buildCurrentSkyBlock(ctxAt('2026-11-18T08:00:00.000Z'));
    expect(sky).toContain('2026-11-18T08:00:00.000Z');
    expect(sky).toContain('TransitYogaX');
    expect(sky).toContain('Belgrade');
  });
});

describe('findGoDeeperTarget', () => {
  const messages = [
    { id: 'u1', role: 'user', content: 'First?' },
    { id: 'a1', role: 'assistant', content: 'One.' },
    { id: 'u2', role: 'user', content: 'Second?' },
    { id: 'a2', role: 'assistant', content: 'Two.' },
  ];

  it('returns the question a reply answered and the messages before it', () => {
    expect(findGoDeeperTarget(messages, 'a2')).toEqual({
      priorMessages: messages.slice(0, 2),
      question: 'Second?',
    });
    expect(findGoDeeperTarget(messages, 'a1')).toEqual({ priorMessages: [], question: 'First?' });
  });

  it('returns null for user messages, unknown ids and replies with no question', () => {
    expect(findGoDeeperTarget(messages, 'u2')).toBeNull();
    expect(findGoDeeperTarget(messages, 'missing')).toBeNull();
    expect(findGoDeeperTarget([{ id: 'a0', role: 'assistant', content: 'Hi' }], 'a0')).toBeNull();
  });
});

describe('goDeeperLabel', () => {
  it('quotes the question on one line and truncates long ones', () => {
    expect(goDeeperLabel('What about\n my career?')).toBe('Go deeper: "What about my career?"');
    const label = goDeeperLabel('x'.repeat(500));
    expect(label.length).toBeLessThan(200);
    expect(label.endsWith('…"')).toBe(true);
  });
});
