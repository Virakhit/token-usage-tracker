(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UsageParser = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function parseRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const usage = record.usage || {};
    const metadata = record.usageMetadata || {};
    const model = record.model || record.modelVersion || 'unknown';
    if (Number.isFinite(usage.prompt_tokens) || Number.isFinite(usage.completion_tokens)) {
      return { provider: 'OpenAI', model, input: Number(usage.prompt_tokens) || 0, output: Number(usage.completion_tokens) || 0, cost: 0, note: 'imported log' };
    }
    if (Number.isFinite(usage.input_tokens) || Number.isFinite(usage.output_tokens)) {
      return { provider: 'Anthropic', model, input: Number(usage.input_tokens) || 0, output: Number(usage.output_tokens) || 0, cost: 0, note: 'imported log' };
    }
    if (Number.isFinite(metadata.promptTokenCount) || Number.isFinite(metadata.candidatesTokenCount)) {
      return { provider: 'Google Gemini', model, input: Number(metadata.promptTokenCount) || 0, output: Number(metadata.candidatesTokenCount) || 0, cost: 0, note: 'imported log' };
    }
    return null;
  }
  function parseUsageText(text) {
    const source = String(text || '').trim();
    if (!source) return [];
    let records = [];
    try {
      const json = JSON.parse(source);
      records = Array.isArray(json) ? json : [json];
    } catch (_) {
      records = source.split(/\r?\n/).filter(Boolean).flatMap(line => {
        try { return [JSON.parse(line)]; } catch (_) { return []; }
      });
    }
    return records.map(parseRecord).filter(Boolean);
  }
  return { parseUsageText, parseRecord };
});
