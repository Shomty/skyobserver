/** Gemini response-schema type strings — avoids shipping @google/genai to the browser. */
export const GeminiType = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

export type GeminiSchemaType = (typeof GeminiType)[keyof typeof GeminiType];
