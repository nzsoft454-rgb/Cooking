/** Gemini structured output 用スキーマ（REST API 形式） */

export const FOOD_PHOTO_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'STRING' },
          confidence: { type: 'STRING' },
          attribute: { type: 'STRING' },
          box_2d: {
            type: 'ARRAY',
            items: { type: 'NUMBER' },
          },
        },
        required: ['name', 'quantity', 'confidence', 'attribute', 'box_2d'],
      },
    },
  },
  required: ['items'],
} as const;

export const RECEIPT_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          rawName: { type: 'STRING' },
          quantity: { type: 'STRING' },
        },
        required: ['rawName'],
      },
    },
  },
  required: ['items'],
} as const;

export const RECIPE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    cookingTime: { type: 'INTEGER' },
    ingredientsList: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          amount: { type: 'STRING' },
        },
        required: ['name'],
      },
    },
    steps: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          stepNumber: { type: 'INTEGER' },
          instruction: { type: 'STRING' },
          timerSeconds: { type: 'INTEGER' },
        },
        required: ['stepNumber', 'instruction'],
      },
    },
    tips: { type: 'STRING' },
    buyAssistText: { type: 'STRING' },
  },
  required: ['title', 'cookingTime', 'ingredientsList', 'steps'],
} as const;
