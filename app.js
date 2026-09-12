'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const number = value => typeof value === 'number' ? value.toLocaleString('en-US') : '—';
const asText = value => typeof value === 'string' ? value : JSON.stringify(value, (key, item) => /(^|_)cost(s)?(_|$)/i.test(key) ? undefined : item, 2) ?? '';
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(label, action) {
  const node = el('button', '', label); node.type = 'button'; node.addEventListener('click', action); return node;
}
function disclosure(label, value) {
  const details = el('details', 'payload'); details.append(el('summary', '', label));
  details.addEventListener('toggle', () => {
    if (details.open && details.childElementCount === 1) details.append(el('pre', '', asText(value)));
  });
  return details;
}
function textBlock(value) {
  const wrapper = el('div'); const text = asText(value);
  const block = el('div', 'message', text); wrapper.append(block);
  if (text.length > 2500 || text.split('\n').length > 24) {
    block.classList.add('long');
    const toggle = button('Show full content', () => {
      const limited = block.classList.toggle('long'); toggle.textContent = limited ? 'Show full content' : 'Limit height';
    }); toggle.className = 'expand-content'; wrapper.append(toggle);
  }
  return wrapper;
}
function field(label, value) {
  const item = el('div'); item.append(el('div', 'meta-label', label), el('div', 'meta-value', value == null ? '—' : asText(value))); return item;
}
function stepNode(step, index) {
  const card = el('details', 'step'); card.open = true;
  const summary = el('summary'); const source = step.source || 'unknown';
  summary.append(el('span', 'step-number', `STEP ${step.step_id ?? index + 1}`), el('span', `role ${['user', 'system'].includes(source) ? source : ''}`, source));
  if (step.tool_calls?.length) summary.append(el('span', 'muted', `${step.tool_calls.length} tool call${step.tool_calls.length === 1 ? '' : 's'}`));
  if (step.timestamp) { const time = el('time', '', step.timestamp); time.dateTime = step.timestamp; summary.append(time); }
  card.append(summary);
  const content = el('div', 'step-content');
  if (step.message !== undefined && step.message !== '') content.append(textBlock(step.message));
  if (step.content !== undefined) content.append(textBlock(step.content));
  if (step.reasoning_content) content.append(disclosure('Reasoning', step.reasoning_content));
  const results = Array.isArray(step.observation?.results) ? step.observation.results : [];
  const matched = new Set();
  for (const call of Array.isArray(step.tool_calls) ? step.tool_calls : []) {
    const tool = el('div', 'tool'); tool.append(el('div', 'tool-heading', `↗ ${call.function_name || 'Tool call'}`));
    tool.append(disclosure('Arguments', call.arguments));
    results.forEach((result, ri) => {
      if (call.tool_call_id && result.source_call_id === call.tool_call_id) {
        matched.add(ri); tool.append(disclosure('Result · content', result.content ?? result));
      }
    });
    tool.append(disclosure('Call details', call)); content.append(tool);
  }
  results.forEach((result, ri) => { if (!matched.has(ri)) content.append(disclosure('Observation · content', result.content ?? result)); });
  if (step.observation && !Array.isArray(step.observation.results)) content.append(disclosure('Observation', step.observation));
  if (step.metrics) content.append(disclosure('Token usage & metrics', step.metrics));
  const turnIds = Object.entries(step.extra || {}).filter(([key]) => key.endsWith('_turn_id'));
  for (const [key, value] of turnIds) content.append(disclosure(`Turn ID · ${key}`, value));
  content.append(disclosure('All step fields', step)); card.append(content); return card;
}
function renderReader(body, doc, attempt) {
  body.replaceChildren();
  const agent = doc.agent || {}, metrics = doc.final_metrics || {};
  const meta = el('div', 'metadata');
  meta.append(field('Model', agent.model_name), field('Agent / version', [agent.name, agent.version].filter(Boolean).join(' / ')), field('Schema', doc.schema_version), field('Session', doc.session_id), field('Included / reported steps', `${doc.steps.length} / ${metrics.total_steps ?? '—'}`));
  body.append(meta);
  body.append(disclosure('Session metadata & final metrics', Object.fromEntries(Object.entries(doc).filter(([key]) => key !== 'steps'))));
  const controls = el('div', 'reader-tools');
  const search = el('input'); search.type = 'search'; search.placeholder = 'Search messages, tools, and content…'; search.setAttribute('aria-label', `Search ${attempt.name}`);
  const source = el('select'); source.setAttribute('aria-label', 'Filter steps by source');
  const all = el('option', '', 'All sources'); all.value = ''; source.append(all);
  [...new Set(doc.steps.map(s => s.source || 'unknown'))].forEach(s => { const option = el('option', '', s); option.value = s; source.append(option); });
  const list = el('div');
  const setOpen = state => list.querySelectorAll('.step').forEach(node => { node.open = state; });
  const download = el('a', '', 'Download JSON');
  const url = URL.createObjectURL(attempt.file); objectURLs.push(url);
  download.href = url; download.download = attempt.name;
  controls.append(search, source, button('Expand steps', () => setOpen(true)), button('Collapse steps', () => setOpen(false)), download);
  const count = el('div', 'step-count'); count.setAttribute('role', 'status'); body.append(controls, count, list);
  // Render in batches; neither attempt count nor step count is hard-coded.
  const searchIndex = doc.steps.map(s => asText(s).toLowerCase());
  let matches = [], shown = 0;
  const more = button('Load more steps', () => appendBatch());
  function appendBatch() {
    const end = Math.min(shown + 50, matches.length);
    const fragment = document.createDocumentFragment();
    for (; shown < end; shown++) { const index = matches[shown]; fragment.append(stepNode(doc.steps[index], index)); }
    list.append(fragment); more.hidden = shown >= matches.length;
    more.textContent = `Load next ${Math.min(50, matches.length - shown)} steps`;
    count.textContent = `${shown} of ${matches.length} matching steps · ${doc.steps.length} included in file · original order`;
  }
  function filter() {
    const query = search.value.trim().toLowerCase();
    matches = doc.steps.map((_, i) => i).filter(i => (!source.value || (doc.steps[i].source || 'unknown') === source.value) && (!query || searchIndex[i].includes(query)));
    shown = 0; list.replaceChildren(); appendBatch();
    if (!matches.length) list.append(el('div', 'empty', 'No steps match these filters.'));
  }
  let debounce;
  search.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(filter, 150); });
  source.addEventListener('change', filter); body.append(more); filter();
}
function attemptNode(attempt) {
  const card = el('details', 'attempt'); const summary = el('summary');
  const names = el('div');
  const match = attempt.name.match(/attempt-(\d+)/);
  names.append(el('div', 'attempt-title', match ? `Attempt ${match[1]}` : attempt.name), el('div', 'attempt-name', attempt.name));
  const stats = el('div', 'attempt-stats');
  stats.append(el('span', '', `${number(Math.ceil(attempt.file.size / 1024))} KB`), el('span', '', 'Expand to read'));
  summary.append(el('span', 'chevron', '›'), names, stats); card.append(summary);
  const body = el('div', 'attempt-body'); card.append(body); let loaded = false, loading = false;
  async function load() {
    if (loaded || loading) return;
    if (attempt.error) { body.replaceChildren(el('div', 'notice error', `Unable to read ${attempt.source}: ${attempt.error}`)); return; }
    loading = true; body.replaceChildren(el('div', 'notice', 'Loading trajectory…'));
    try {
      const doc = JSON.parse(await attempt.file.text());
      validateTrajectory(doc);
      if (!card.isConnected) return;
      renderReader(body, doc, attempt); loaded = true;
      stats.replaceChildren(el('span', '', `${number(doc.steps.length)} steps`), el('span', '', `${number(doc.final_metrics?.total_completion_tokens)} output tokens`));
    } catch (error) {
      body.replaceChildren(el('div', 'notice error', `Could not load this attempt: ${error.message}`), button('Retry', load));
    } finally { loading = false; }
  }
  card.addEventListener('toggle', () => { if (card.open) load(); }); return card;
}
const PREFERRED = ['claude-code-claude-haiku-4-5', 'claude-code-claude-opus-5',
  'claude-code-claude-muse-spark-1.2', 'codex-gpt-5.6-sol'];
const objectURLs = [];
function validateTrajectory(doc) {
  if (!doc || !Array.isArray(doc.steps) || doc.steps.some(step => !step || typeof step !== 'object' || Array.isArray(step))) {
    throw new Error('Expected a JSON object with a steps array containing step objects.');
  }
}
function discover(files) {
  const groups = new Map();
  for (const file of files) {
    const parts = file.webkitRelativePath.split('/');
    // Accept runs/ itself or its adaptive-predicate-ordering/ child.
    const base = parts[0] === 'runs' && parts[1] === 'adaptive-predicate-ordering' ? 2
      : parts[0] === 'adaptive-predicate-ordering' ? 1 : -1;
    if (base < 0 || parts.length <= base + 1 || parts[base].startsWith('.')) continue;
    const model = parts[base];
    if (!groups.has(model)) groups.set(model, []);
    const match = file.name.match(/^attempt-(\d+)-trajectory\.json$/);
    if (parts.length === base + 3 && parts[base + 1] === 'prior' && match) {
      groups.get(model).push({name: file.name, source: file.webkitRelativePath, file});
    }
  }
  const names = PREFERRED.every(name => groups.has(name)) ? PREFERRED : [...groups.keys()].sort().slice(0, 4);
  const numeric = new Intl.Collator('en', {numeric: true});
  return names.map(name => ({name, attempts: groups.get(name).sort((a, b) => numeric.compare(a.name, b.name))}));
}
function renderModels(models) {
  objectURLs.splice(0).forEach(url => URL.revokeObjectURL(url));
  for (const id of ['overview', 'navigator', 'models', 'status']) $('#' + id).replaceChildren();
  const attempts = models.flatMap(model => model.attempts);
  const stats = [['Models', models.length], ['Attempts', attempts.length], ['Reading', 'On demand'], ['Data stays', 'On your device']];
  for (const [label, value] of stats) {
    const stat = el('div', 'stat');
    stat.append(el('span', '', label), el('strong', '', typeof value === 'number' ? number(value) : value));
    $('#overview').append(stat);
  }
  $('#dataset-label').textContent = 'runs / adaptive-predicate-ordering';
  if (!attempts.length) $('#status').append(el('div', 'notice', 'No matching attempts found. Select runs/ containing adaptive-predicate-ordering/<model>/prior/attempt-01-trajectory.json.'));
  const sections = [];
  const links = [];
  function select(link, modelIndex) {
    sections.forEach((section, index) => { section.hidden = modelIndex !== null && index !== modelIndex; });
    links.forEach(node => node.removeAttribute('aria-current'));
    link.setAttribute('aria-current', 'true');
  }
  const all = button('All models', () => select(all, null));
  all.className = 'nav-all'; all.setAttribute('aria-current', 'true');
  links.push(all); $('#navigator').append(all);
  models.forEach((model, modelIndex) => {
    const section = el('section', 'model'); const title = el('div', 'model-title');
    title.append(el('span', 'dot'), el('h3', '', model.name), el('span', 'count', `${model.attempts.length} attempts`)); section.append(title);
    const group = el('details', 'nav-group'); group.open = true;
    const heading = el('summary', '', model.name); group.append(heading);
    const modelLink = button(`All attempts (${model.attempts.length})`, () => {
      select(modelLink, modelIndex);
      section.scrollIntoView({block: 'start'});
    });
    modelLink.className = 'nav-model'; links.push(modelLink); group.append(modelLink);
    model.attempts.forEach((attempt, attemptIndex) => {
      const card = attemptNode(attempt); card.id = `attempt-${modelIndex}-${attemptIndex}`;
      section.append(card);
      const match = attempt.name.match(/attempt-(\d+)/);
      const link = button(match ? `Attempt ${match[1]}` : attempt.name, () => {
        select(link, modelIndex);
        card.open = true;
        card.scrollIntoView({block: 'start'});
        $('summary', card).focus({preventScroll: true});
      });
      link.className = 'nav-attempt'; link.title = attempt.name;
      link.setAttribute('aria-controls', card.id);
      link.setAttribute('aria-label', `${model.name} · ${attempt.name}`);
      links.push(link); group.append(link);
    });
    if (!model.attempts.length) section.append(el('div', 'notice', 'No attempt files in this model’s prior/ directory.'));
    $('#models').append(section); sections.push(section); $('#navigator').append(group);
  });
}
function init() {
  $('#choose-folder').addEventListener('click', () => $('#folder-input').click());
  $('#folder-input').addEventListener('change', event => {
    const files = [...event.target.files];
    if (!files.length) return;
    renderModels(discover(files));
    $('#choose-folder').textContent = 'Choose another folder';
    event.target.value = '';
  });
}
init();
