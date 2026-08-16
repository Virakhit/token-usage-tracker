const assert = require('node:assert/strict');
const { parseUsageText } = require('./usage-parser');

const parsed = parseUsageText([
  JSON.stringify({ model: 'gpt-4o-mini', usage: { prompt_tokens: 12, completion_tokens: 8 } }),
  JSON.stringify({ model: 'claude-3-5-sonnet', usage: { input_tokens: 20, output_tokens: 5 } }),
  JSON.stringify({ model: 'gemini-2.0-flash', usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 10 } }),
].join('\n'));
assert.deepEqual(parsed.map(x => [x.provider, x.model, x.input, x.output]), [
  ['OpenAI', 'gpt-4o-mini', 12, 8],
  ['Anthropic', 'claude-3-5-sonnet', 20, 5],
  ['Google Gemini', 'gemini-2.0-flash', 30, 10],
]);
assert.deepEqual(parseUsageText('{"usage":{"prompt_tokens":3,"completion_tokens":2}}')[0], {
  provider: 'OpenAI', model: 'unknown', input: 3, output: 2, cost: 0, note: 'imported log'
});
console.log('usage-parser tests passed');
