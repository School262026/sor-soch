import { SUBJECTS, topicsFor, sourcesFor } from './topics.js';
import { generateAKR, gradeSheet, writeAnalysis } from './ai.js';
import {
  L, esc, specPage, taskPage, answerPage, keyPage, analysisBlankPage, allPages,
  taskPoints, totalPoints, levelOf, markOf,
} from './render.js';

const $ = (s) => document.querySelector(s);

// ---------- Сақтау (тек осы құрылғыда) ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch { alert('Құрылғы жады толды: ескі жұмыстарды немесе нәтижелерді өшіріңіз (алдымен Excel-ге сақтап алыңыз).'); return false; }
  },
};
let settings = store.get('akr.settings', { key: '', model: 'claude-opus-5-5', school: '' });
let passports = store.get('akr.passports', []);
let results = store.get('akr.results', []);
let current = null;

const savePassports = () => store.set('akr.passports', passports);
const saveResults = () => store.set('akr.results', results);

// ---------- Шығынды есептеу ($ / 1 млн токен) ----------
const PRICE = { 'claude-opus-5-5': [4, 20], 'claude-sonnet-5-5': [2, 10] };
function addCost(usage) {
  if (!usage) return '';
  const [pin, pout] = PRICE[settings.model] || PRICE['claude-opus-5-5'];
  const usd = ((usage.input_tokens || 0) * pin + (usage.cache_creation_input_tokens || 0) * pin * 1.25
    + (usage.cache_read_input_tokens || 0) * pin * 0.1 + (usage.output_tokens || 0) * pout) / 1e6;
  const total = store.get('akr.cost', 0) + usd;
  store.set('akr.cost', total);
  showCost();
  return `≈ $${usd.toFixed(3)}`;
}
function showCost() { $('#s-cost').textContent = `барлығы ≈ $${store.get('akr.cost', 0).toFixed(2)} (осы құрылғыда)`; }

function status(el, msg, kind = '') {
  el.className = `status ${kind}`;
  el.innerHTML = kind === 'busy' ? `<span class="spinner"></span>${esc(msg)}` : esc(msg);
}

// ---------- Қойындылар ----------
document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.id === `tab-${b.dataset.tab}`));
  if (b.dataset.tab === 'check') fillPassportSelect($('#c-passport'));
  if (b.dataset.tab === 'results') { fillPassportSelect($('#r-passport')); renderResults(); }
}));

// =====================================================================
// 1. ҚҰРАСТЫРУ
// =====================================================================
function fillSubjects() {
  const lang = $('#g-lang').value;
  const cur = $('#g-subject').value || 'math';
  $('#g-subject').innerHTML = Object.entries(SUBJECTS).map(([k, v]) => `<option value="${k}">${v[lang]}</option>`).join('');
  $('#g-subject').value = cur;
}
const gArgs = () => [+$('#g-grade').value, +$('#g-quarter').value, $('#g-subject').value, $('#g-lang').value];
// Мектептің КТП/КТЖ файлдарынан жасалған деректер (ktp/index.json, әр файл тоқсанға бөлінген).
let ktpIndex = [];
const ktpCache = {};
fetch('ktp/index.json').then((r) => r.json()).then((x) => { ktpIndex = x; fillSources(); }).catch(() => {});

function fillSources() {
  const [grade, , subject, lang] = gArgs();
  const ktp = ktpIndex.filter((k) => k.grade === grade && k.subject === subject && k.lang === lang)
    .map((k) => ({ id: `ktp:${k.id}`, name: `КТП ${k.grade} ${k.cls} — ${k.title}` }));
  const list = [...ktp, ...sourcesFor(...gArgs())];
  // Бірінші — мектептің КТП-сы (бар болса), сосын ӘБЖ бойынша база, сосын оқулықтар.
  $('#g-source').innerHTML = list.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')
    + '<option value="own">Өзім жазамын / КТЖ PDF</option>';
  fillTopics();
}
async function fillTopics() {
  const src = $('#g-source').value;
  const [, quarter] = gArgs();
  $('#g-topics').placeholder = 'КТЖ-дан тоқсанда өтілген тақырыптарды осында жазыңыз немесе КТЖ-ның PDF файлын төменде тіркеңіз.';
  if (src === 'own') { $('#g-topics').value = ''; return; }
  if (!src.startsWith('ktp:')) { $('#g-topics').value = topicsFor(...gArgs(), src); return; }
  const id = src.slice(4);
  try {
    ktpCache[id] = ktpCache[id] || await (await fetch(`ktp/${id}.json`)).json();
    const k = ktpCache[id];
    const text = k.quarters[quarter - 1];
    $('#g-topics').value = text ? `Мектептің КТП-сы: ${k.title} (${k.grade} ${k.cls}), ${quarter}-тоқсан. Сабақ тақырыптары мен оқу мақсаттары:\n${text}` : '';
    if (!text) $('#g-topics').placeholder = `Бұл КТП-дан ${quarter}-тоқсан бөлімі табылмады. Тақырыптарды қолмен жазыңыз немесе КТП PDF-ін тіркеңіз.`;
  } catch {
    $('#g-topics').value = '';
  }
}
['#g-grade', '#g-subject'].forEach((s) => $(s).addEventListener('change', fillSources));
// Аралық бағалаудың ең жоғары балы: 2-сынып — 12, 3 — 14, 4 — 16 (орыс тілі 16: 7 + 9)
const MAX_POINTS = { 1: 12, 2: 12, 3: 14, 4: 16 };
function fillPoints() {
  const v = $('#g-subject').value === 'rus' ? 16 : MAX_POINTS[+$('#g-grade').value];
  if (![...$('#g-points').options].some((o) => +o.value === v)) $('#g-points').add(new Option(v, v));
  $('#g-points').value = v;
}
['#g-grade', '#g-subject'].forEach((s) => $(s).addEventListener('change', fillPoints));
$('#g-quarter').addEventListener('change', fillTopics);
$('#g-source').addEventListener('change', fillTopics);
$('#g-lang').addEventListener('change', () => { fillSubjects(); fillSources(); });

// WhatsApp, Telegram ішіндегі браузерлер confirm() терезесін көрсетпейді — екі рет басу арқылы растаймыз.
function twoTap(btn, action) {
  if (btn.dataset.armed) { action(); return; }
  btn.dataset.armed = '1';
  const old = btn.textContent;
  btn.textContent = 'Өшіру? ✔';
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = old; }, 3000);
}

let attachments = [];
$('#g-files').addEventListener('change', async (e) => {
  attachments = [];
  for (const f of e.target.files) {
    if (f.size > 25 * 1024 * 1024) { alert(`${f.name}: файл 25 МБ-тан үлкен. Тек керек беттерін бөлек PDF қылып сақтаңыз.`); continue; }
    attachments.push({ name: f.name, data: await fileToBase64(f) });
  }
  $('#g-filelist').textContent = attachments.map((a) => `📎 ${a.name}`).join('   ');
});

$('#g-go').addEventListener('click', async () => {
  const st = $('#g-status');
  const topics = $('#g-topics').value.trim();
  if (!topics && !attachments.length) return status(st, 'Тақырыптарды жазыңыз немесе КТЖ PDF файлын тіркеңіз.', 'err');
  const lang = $('#g-lang').value;
  const req = {
    grade: +$('#g-grade').value, quarter: +$('#g-quarter').value, subject: $('#g-subject').value,
    subjectName: SUBJECTS[$('#g-subject').value][lang], lang, points: +$('#g-points').value,
    topics, notes: $('#g-notes').value.trim(), attachments,
  };
  $('#g-go').disabled = true;
  status(st, 'Claude АКР жазып жатыр… Әдетте 2–5 минут кетеді, бетті жаппаңыз.', 'busy');
  try {
    const { passport, usage } = await generateAKR(settings, req);
    const p = normalize(passport, req);
    passports.unshift(p);
    savePassports();
    renderPassportList();
    openPassport(p);
    status(st, `Дайын! ${addCost(usage)}. Төменде тексеріп, басып шығарыңыз.`);
  } catch (e) {
    status(st, e.message, 'err');
  } finally {
    $('#g-go').disabled = false;
  }
});

// Модель жауабын тексеріп, мета-деректерді қосу.
function normalize(p, req) {
  const out = {
    ...p,
    id: `akr-${Date.now().toString(36)}`,
    created: new Date().toISOString(),
    grade: req.grade, quarter: req.quarter, subject: req.subject, subjectName: req.subjectName, lang: req.lang,
    warnings: [],
  };
  const tp = taskPoints(out);
  out.variants = out.variants.slice(0, 2);
  if (out.variants.length < 2) out.warnings.push('Модель тек бір нұсқа жасады.');
  out.variants.forEach((v, vi) => {
    if (!v.name) v.name = req.lang === 'ru' ? `${vi + 1} вариант` : `${vi + 1}-нұсқа`;
    v.tasks.forEach((t) => {
      if (tp[t.n] === undefined) out.warnings.push(`${v.name}, ${t.n}-тапсырмаға дескриптор жоқ.`);
      else if (t.points !== tp[t.n]) { out.warnings.push(`${v.name}, ${t.n}-тапсырма: балл ${t.points} → дескриптор бойынша ${tp[t.n]} болып түзетілді.`); t.points = tp[t.n]; }
    });
  });
  out.spec.forEach((r) => { if (tp[r.n] !== undefined) r.points = tp[r.n]; });
  const sig = (v) => JSON.stringify(v.tasks.map((t) => t.items.map((i) => i.answer)));
  if (out.variants.length === 2 && sig(out.variants[0]) === sig(out.variants[1])) out.warnings.push('Екі нұсқаның жауаптары бірдей — қайта жасаған дұрыс.');
  return out;
}

function renderPassportList() {
  const box = $('#p-list');
  if (!passports.length) { box.innerHTML = '<p class="muted">Әзірге жұмыс жоқ.</p>'; return; }
  box.innerHTML = passports.map((p, i) => `<div class="plist-item">
    <span><b>${esc(p.subjectName)}</b>, ${p.grade}-сынып, ${p.quarter}-тоқсан, ${p.lang === 'kk' ? 'қаз' : 'орыс'} • ${totalPoints(p)} балл
    <small class="muted">${new Date(p.created).toLocaleString()}</small></span>
    <button data-open="${i}">Ашу</button><button data-exp="${i}">💾</button><button data-del="${i}">🗑️</button></div>`).join('');
  box.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => openPassport(passports[+b.dataset.open]));
  box.querySelectorAll('[data-exp]').forEach((b) => b.onclick = () => exportPassport(passports[+b.dataset.exp]));
  box.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => twoTap(b, () => {
    const p = passports[+b.dataset.del];
    passports.splice(+b.dataset.del, 1); savePassports(); renderPassportList();
    if (current && current.id === p.id) $('#preview').classList.add('hidden');
  }));
}

$('#p-import').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const p = JSON.parse(await f.text());
    if (!p.id || !p.variants || !p.descriptors) throw new Error();
    passports = passports.filter((x) => x.id !== p.id);
    passports.unshift(p); savePassports(); renderPassportList(); openPassport(p);
  } catch { alert('Бұл АКР паспорты емес немесе файл бүлінген.'); }
  e.target.value = '';
});

function exportPassport(p) {
  download(`АКР-${p.subjectName}-${p.grade}сынып-${p.quarter}тоқсан-${p.lang}.json`, JSON.stringify(p), 'application/json');
}

function partHTML(p, part) {
  return ({
    all: () => allPages(p), spec: () => specPage(p), t0: () => taskPage(p, 0), t1: () => taskPage(p, 1),
    a0: () => answerPage(p, 0), a1: () => answerPage(p, 1), key: () => keyPage(p), anl: () => analysisBlankPage(p),
  }[part] || (() => ''))();
}

function openPassport(p) {
  current = p;
  $('#preview').classList.remove('hidden');
  $('#pv-title').textContent = p.title;
  $('#pv-warn').classList.toggle('hidden', !p.warnings?.length);
  $('#pv-warn').innerHTML = (p.warnings || []).map(esc).join('<br>');
  $('#pv-part').value = 'all';
  $('#pv-pages').innerHTML = allPages(p);
  $('#preview').scrollIntoView({ behavior: 'smooth' });
}
$('#pv-part').addEventListener('change', () => { $('#pv-pages').innerHTML = partHTML(current, $('#pv-part').value); });
$('#pv-print').addEventListener('click', () => printHTML(partHTML(current, $('#pv-part').value)));
$('#pv-json').addEventListener('click', () => exportPassport(current));
$('#pv-word').addEventListener('click', async () => {
  const part = $('#pv-part').value;
  await downloadWord(`АКР-${current.subjectName}-${current.grade}сынып-${part}.doc`, partHTML(current, part));
});

function printHTML(html) {
  $('#print-area').innerHTML = html;
  // Суреттер жүктелгенше күтеміз
  const imgs = [...$('#print-area').querySelectorAll('img')];
  Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => window.print());
}

// =====================================================================
// 2. ТЕКСЕРУ
// =====================================================================
function fillPassportSelect(sel) {
  const prev = sel.value;
  sel.innerHTML = passports.length
    ? passports.map((p) => `<option value="${p.id}">${esc(p.subjectName)}, ${p.grade}-сынып, ${p.quarter}-тоқсан (${p.lang === 'kk' ? 'қаз' : 'орыс'})</option>`).join('')
    : '<option value="">— алдымен АКР жасаңыз немесе паспортты жүктеңіз —</option>';
  if (passports.some((p) => p.id === prev)) sel.value = prev;
}

let shots = [];
async function addShots(files) {
  for (const f of files) shots.push(await downscale(f));
  $('#c-thumbs').innerHTML = shots.map((s) => `<img src="data:image/jpeg;base64,${s}" alt="">`).join('');
  $('#c-go').disabled = !shots.length;
}
$('#c-cam').addEventListener('change', (e) => { addShots(e.target.files); e.target.value = ''; });
$('#c-gal').addEventListener('change', (e) => { addShots(e.target.files); e.target.value = ''; });
$('#c-clear').addEventListener('click', () => { shots = []; $('#c-thumbs').innerHTML = ''; $('#c-go').disabled = true; });
$('#c-class').value = store.get('akr.lastClass', '');

$('#c-go').addEventListener('click', async () => {
  const p = passports.find((x) => x.id === $('#c-passport').value);
  const st = $('#c-status');
  if (!p) return status(st, 'Жұмысты таңдаңыз.', 'err');
  store.set('akr.lastClass', $('#c-class').value.trim());
  $('#c-go').disabled = true;
  status(st, 'Парақ оқылып, тексерілуде… (30–90 секунд)', 'busy');
  try {
    const { grading, usage } = await gradeSheet(settings, p, shots);
    const r = buildResult(p, grading);
    status(st, `Дайын ${addCost(usage)}. Нәтижені қарап, қажет болса ✅/❌ басып түзетіңіз, сосын «Сақтау».`);
    showResult(p, r);
  } catch (e) {
    status(st, e.message, 'err');
  } finally {
    $('#c-go').disabled = false;
  }
});

function variantIndex(p, v) {
  const m = String(v || '').match(/[12]/);
  return m ? +m[0] - 1 : 0;
}

function buildResult(p, g) {
  const marks = {};
  for (const r of g.results) marks[`${r.task_n}:${r.index}`] = r;
  const rows = [];
  p.descriptors.forEach((d) => d.items.forEach((it, k) => {
    const r = marks[`${d.task_n}:${k}`] || { met: false, student_answer: '', comment: 'Модель бұл дескрипторды бағаламады — қолмен тексеріңіз.', confident: false };
    rows.push({ task_n: d.task_n, index: k, text: it.text, points: it.points, met: !!r.met, sa: r.student_answer, comment: r.comment, confident: r.confident });
  }));
  return {
    id: `r-${Date.now().toString(36)}`, passportId: p.id, ts: new Date().toISOString(),
    name: g.student_name, cls: $('#c-class').value.trim() || g.class_name, variant: variantIndex(p, g.variant),
    legibility: g.legibility, note: g.general_comment, rows, errorWork: g.error_work,
  };
}

function score(p, r) {
  const per = {};
  Object.keys(taskPoints(p)).forEach((n) => (per[n] = 0));
  r.rows.forEach((x) => { if (x.met) per[x.task_n] += x.points; });
  const total = Object.values(per).reduce((a, b) => a + b, 0);
  const max = totalPoints(p);
  const pct = Math.round((total / max) * 1000) / 10;
  return { per, total, max, pct, level: levelOf(pct), mark: markOf(pct, p.grade) };
}

const LEVELS = { kk: ['Төмен', 'Орташа', 'Жоғары'], ru: ['Низкий', 'Средний', 'Высокий'] };

function showResult(p, r) {
  const box = $('#c-result');
  box.classList.remove('hidden');
  const draw = () => {
    const s = score(p, r);
    box.innerHTML = `
      <div class="res-head">
        <label class="grow">Оқушы <input id="rv-name" value="${esc(r.name)}"></label>
        <label>Сынып <input id="rv-cls" value="${esc(r.cls)}" size="8"></label>
        <label>Нұсқа <select id="rv-var">${p.variants.map((v, i) => `<option value="${i}" ${i === r.variant ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>
      </div>
      <div class="score-big">
        <div><small>Балл</small><b>${s.total}/${s.max}</b></div>
        <div><small>Пайыз</small><b>${s.pct}%</b></div>
        <div><small>Деңгей</small><b style="font-size:18px">${LEVELS[p.lang][s.level]}</b></div>
        <div><small>Баға</small><b>${s.mark}</b></div>
        <div><small>Дұрыс / қате</small><b style="font-size:18px">${r.rows.filter((x) => x.met).length} / ${r.rows.filter((x) => !x.met).length}</b></div>
      </div>
      ${r.legibility !== 'good' ? '<p class="warn">Фото немесе жазу анық емес — сары белгіленген жолдарды міндетті түрде қолмен тексеріңіз.</p>' : ''}
      ${r.note ? `<p class="muted">${esc(r.note)}</p>` : ''}
      ${r.rows.map((x, i) => `<div class="desc-row">
        <button data-i="${i}" class="${x.met ? 'met' : 'not'}" title="Ауыстыру">${x.met ? '✅' : '❌'}</button>
        <div><b>${x.task_n}-т.</b> ${esc(x.text)} <small>(${x.points} б.)</small>
          <div class="sa ${x.confident ? '' : 'unsure'}">${x.confident ? '' : '⚠️ '}Оқушы: ${esc(x.sa)} — ${esc(x.comment)}</div></div>
      </div>`).join('')}
      ${errorWorkHTML(r)}
      <button id="rv-save" class="primary">💾 Сақтау</button> <button id="rv-slip">🖨️ Оқушы парағы</button> <button id="rv-next">Келесі оқушы ➜</button>`;
    $('#rv-slip').onclick = () => { sync(); printHTML(slipHTML(p, r)); };
    box.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const x = r.rows[+b.dataset.i]; x.met = !x.met; x.edited = true; sync(); draw(); });
    $('#rv-save').onclick = () => {
      sync();
      Object.assign(r, score(p, r));
      results = results.filter((x) => x.id !== r.id);
      results.push(r); saveResults();
      $('#rv-save').textContent = '✔ Сақталды';
    };
    $('#rv-next').onclick = () => { shots = []; $('#c-thumbs').innerHTML = ''; $('#c-go').disabled = true; box.classList.add('hidden'); $('#c-status').textContent = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  };
  const sync = () => {
    if (!$('#rv-name')) return;
    r.name = $('#rv-name').value.trim(); r.cls = $('#rv-cls').value.trim(); r.variant = +$('#rv-var').value;
  };
  draw();
  box.scrollIntoView({ behavior: 'smooth' });
}

// «Қатемен жұмыс» — модель әр оқушыға жазған жоспар (мұғалім басып шығарып береді).
function errorWorkHTML(r) {
  const w = r.errorWork;
  if (!w) return '';
  return `<div class="errwork"><h4>📌 Қатемен жұмыс</h4>${w.summary ? `<p>${esc(w.summary)}</p>` : ''}
    ${w.steps.length ? `<table class="res"><tr><th>Дағды</th><th>Нені қайталау</th><th>Жаттығу</th></tr>
      ${w.steps.map((s) => `<tr><td class="l">${esc(s.skill)}</td><td class="l">${esc(s.repeat)}</td><td class="l">${esc(s.exercise)}</td></tr>`).join('')}</table>` : ''}</div>`;
}

function slipHTML(p, r) {
  const s = score(p, r);
  const w = r.errorWork || { summary: '', steps: [] };
  return `<section class="page">
    <h2>${p.lang === 'ru' ? 'РАБОТА НАД ОШИБКАМИ' : 'ҚАТЕМЕН ЖҰМЫС'}</h2>
    <p class="sub">${esc(p.title)}</p>
    <p><b>${esc(r.name)}</b>, ${esc(r.cls)} • ${esc(p.variants[r.variant]?.name || '')}<br>
      ${p.lang === 'ru' ? 'Балл' : 'Балл'}: <b>${s.total}/${s.max}</b> • ${s.pct}% • ${LEVELS[p.lang][s.level]}${s.mark !== '—' ? ` • «${s.mark}»` : ''}</p>
    <table><tr><th>№</th><th>${p.lang === 'ru' ? 'Дескриптор' : 'Дескриптор'}</th><th></th></tr>
      ${r.rows.map((x) => `<tr><td>${x.task_n}</td><td>${esc(x.text)}</td><td>${x.met ? '✔' : '✘'}</td></tr>`).join('')}</table>
    ${w.summary ? `<p>${esc(w.summary)}</p>` : ''}
    ${w.steps.length ? `<table><tr><th>${p.lang === 'ru' ? 'Навык' : 'Дағды'}</th><th>${p.lang === 'ru' ? 'Что повторить' : 'Нені қайталау'}</th><th>${p.lang === 'ru' ? 'Упражнение' : 'Жаттығу'}</th></tr>
      ${w.steps.map((x) => `<tr><td>${esc(x.skill)}</td><td>${esc(x.repeat)}</td><td>${esc(x.exercise)}</td></tr>`).join('')}</table>` : ''}
    <p class="sign">${p.lang === 'ru' ? 'Учитель' : 'Мұғалім'}: ____________________</p>
  </section>`;
}

// =====================================================================
// 3. НӘТИЖЕЛЕР
// =====================================================================
$('#r-passport').addEventListener('change', renderResults);
$('#r-class').addEventListener('change', () => renderResults(true));

function selectedResults() {
  const pid = $('#r-passport').value;
  const cls = $('#r-class').value;
  return results.filter((r) => r.passportId === pid && (!cls || r.cls === cls));
}

function renderResults(keepClass) {
  const p = passports.find((x) => x.id === $('#r-passport').value);
  if (!p) { $('#r-table').innerHTML = '<p class="muted">Жұмыс таңдалмаған.</p>'; $('#r-stats').innerHTML = ''; return; }
  if (keepClass !== true) {
    const classes = [...new Set(results.filter((r) => r.passportId === p.id).map((r) => r.cls))].sort();
    $('#r-class').innerHTML = '<option value="">Барлық сынып</option>' + classes.map((c) => `<option>${esc(c)}</option>`).join('');
  }
  const rs = selectedResults();
  const tp = taskPoints(p);
  const ns = Object.keys(tp);
  if (!rs.length) { $('#r-table').innerHTML = '<p class="muted">Әзірге тексерілген жұмыс жоқ.</p>'; $('#r-stats').innerHTML = ''; return; }
  const st = stats(p, rs);
  $('#r-stats').innerHTML = `<div class="score-big">
    <div><small>Қатысқаны</small><b>${rs.length}</b></div>
    <div><small>Орташа балл</small><b>${st.avg}</b></div>
    <div><small>Орташа %</small><b>${st.avgPct}%</b></div>
    <div><small>Үлгерім</small><b>${st.success}%</b></div>
    <div><small>Сапа («4»+«5»)</small><b>${st.quality}%</b></div></div>`;
  $('#r-table').innerHTML = `<table class="res"><tr><th>№</th><th>Оқушы</th><th>Сынып</th><th>Нұсқа</th>${ns.map((n) => `<th>${n} (${tp[n]})</th>`).join('')}<th>Барлығы</th><th>%</th><th>Деңгей</th><th>Баға</th><th></th></tr>
    ${rs.map((r, i) => { const s = score(p, r); return `<tr><td>${i + 1}</td><td class="l">${esc(r.name)}</td><td>${esc(r.cls)}</td><td>${r.variant + 1}</td>${ns.map((n) => `<td>${s.per[n]}</td>`).join('')}<td><b>${s.total}</b></td><td>${s.pct}</td><td>${LEVELS[p.lang][s.level]}</td><td>${s.mark}</td><td><button data-rdel="${r.id}">🗑️</button></td></tr>`; }).join('')}
    <tr><td></td><td class="l">Орындау, %</td><td></td><td></td>${ns.map((n) => `<td>${st.taskPct[n]}</td>`).join('')}<td></td><td></td><td></td><td></td><td></td></tr></table>`;
  $('#r-table').querySelectorAll('[data-rdel]').forEach((b) => b.onclick = () => twoTap(b, () => {
    results = results.filter((r) => r.id !== b.dataset.rdel); saveResults(); renderResults(true);
  }));
}

function stats(p, rs) {
  const tp = taskPoints(p);
  const scored = rs.map((r) => ({ r, s: score(p, r) }));
  const n = rs.length;
  const sum = (f) => scored.reduce((a, x) => a + f(x), 0);
  const taskPct = {};
  Object.keys(tp).forEach((t) => { taskPct[t] = Math.round((sum((x) => x.s.per[t]) / (tp[t] * n)) * 100); });
  const levels = [0, 0, 0]; scored.forEach((x) => levels[x.s.level]++);
  const marks = { 2: 0, 3: 0, 4: 0, 5: 0 }; scored.forEach((x) => { if (marks[x.s.mark] !== undefined) marks[x.s.mark]++; });
  const descPct = p.descriptors.flatMap((d) => d.items.map((it, k) => ({
    task: d.task_n, text: it.text,
    pct: Math.round((rs.filter((r) => r.rows.find((x) => x.task_n === d.task_n && x.index === k)?.met).length / n) * 100),
  })));
  return {
    count: n, max: totalPoints(p),
    avg: Math.round((sum((x) => x.s.total) / n) * 10) / 10,
    avgPct: Math.round(sum((x) => x.s.pct) / n),
    success: Math.round(((n - marks[2]) / n) * 100),
    quality: Math.round(((marks[4] + marks[5]) / n) * 100),
    levels, marks, taskPct, descPct,
    low: scored.filter((x) => x.s.level === 0).map((x) => ({
      name: x.r.name, missed: x.r.rows.filter((y) => !y.met).map((y) => `${y.task_n}-т.: ${y.text}`),
    })),
  };
}

$('#r-xlsx').addEventListener('click', async () => {
  const p = passports.find((x) => x.id === $('#r-passport').value);
  const rs = selectedResults();
  if (!p || !rs.length) return;
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
  const tp = taskPoints(p); const ns = Object.keys(tp); const st = stats(p, rs);
  const head = ['№', 'Оқушының аты-жөні', 'Сынып', 'Нұсқа', ...ns.map((n) => `${n}-т. (${tp[n]})`), `Барлығы (${st.max})`, '%', 'Деңгей', 'Баға'];
  const rows = rs.map((r, i) => { const s = score(p, r); return [i + 1, r.name, r.cls, r.variant + 1, ...ns.map((n) => s.per[n]), s.total, s.pct, LEVELS[p.lang][s.level], s.mark]; });
  rows.push(['', 'Орындау пайызы, %', '', '', ...ns.map((n) => st.taskPct[n])]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[p.title], [], head, ...rows]), '1-Нәтижелер');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Деңгей', 'Оқушы саны', 'Үлесі, %'],
    ...LEVELS[p.lang].map((l, i) => [l, st.levels[i], Math.round((st.levels[i] / st.count) * 100)]),
    [], ['Баға', 'Оқушы саны'], ...[5, 4, 3, 2].map((m) => [`«${m}»`, st.marks[m]]),
    [], ['Үлгерім, %', st.success], ['Сапа, %', st.quality], ['Орташа балл', st.avg],
  ]), '2-Деңгейлер');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Тапсырма', 'Дескриптор', 'Орындаған, %'], ...st.descPct.map((d) => [d.task, d.text, d.pct]),
  ]), '3-Дескрипторлар');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Оқушы', 'Сынып', 'Қорытынды', 'Дағды', 'Нені қайталау', 'Жаттығу'],
    ...rs.flatMap((r) => {
      const w = r.errorWork;
      if (!w) return [[r.name, r.cls, '(жоқ)']];
      return w.steps.length ? w.steps.map((x, i) => [i ? '' : r.name, i ? '' : r.cls, i ? '' : w.summary, x.skill, x.repeat, x.exercise]) : [[r.name, r.cls, w.summary]];
    }),
  ]), '4-Қатемен жұмыс');
  XLSX.writeFile(wb, `АКР-нәтиже-${p.subjectName}-${p.grade}сынып-${$('#r-class').value || 'барлығы'}.xlsx`);
});

let anlHTML = '';
$('#r-anl').addEventListener('click', async () => {
  const p = passports.find((x) => x.id === $('#r-passport').value);
  const rs = selectedResults();
  const stEl = $('#r-status');
  if (!p || !rs.length) return status(stEl, 'Алдымен жұмыс пен нәтижелерді таңдаңыз.', 'err');
  const st = stats(p, rs);
  status(stEl, 'Анықтама-талдау жазылып жатыр…', 'busy');
  try {
    const a = await writeAnalysis(settings, p, st);
    const cls = $('#r-class').value || [...new Set(rs.map((r) => r.cls))].join(', ');
    const lv = LEVELS[p.lang];
    anlHTML = `<section class="page">
      <h2>АНЫҚТАМА-ТАЛДАУ</h2>
      <p class="sub">${esc(cls)} сыныбында ${esc(p.subjectName.toLowerCase())} пәнінен әкімшілік бақылау жұмысының нәтижелері бойынша${settings.school ? `<br>${esc(settings.school)}` : ''}</p>
      <p>Жұмысты орындағандар: ${st.count} оқушы. Ең жоғары балл: ${st.max}.</p>
      <h3>1. Сандық көрсеткіштер</h3>
      <table><tr><th>Көрсеткіш</th><th>Мәні</th></tr>
        <tr><td>Орташа балл</td><td>${st.avg} / ${st.max}</td></tr>
        <tr><td>Орташа орындау пайызы</td><td>${st.avgPct}%</td></tr>
        <tr><td>Үлгерім (абсолюттік көрсеткіш)</td><td>${st.success}%</td></tr>
        <tr><td>Білім сапасы («4» және «5»)</td><td>${st.quality}%</td></tr></table>
      <h3>2. Деңгейлер мен бағалар</h3>
      <table><tr><th>Деңгей</th><th>Оқушы</th><th>Баға</th><th>Оқушы</th></tr>
        <tr><td>${lv[2]} (85–100%)</td><td>${st.levels[2]}</td><td>«5»</td><td>${st.marks[5]}</td></tr>
        <tr><td rowspan="2">${lv[1]} (40–84%)</td><td rowspan="2">${st.levels[1]}</td><td>«4»</td><td>${st.marks[4]}</td></tr>
        <tr><td>«3»</td><td>${st.marks[3]}</td></tr>
        <tr><td>${lv[0]} (0–39%)</td><td>${st.levels[0]}</td><td>«2»</td><td>${st.marks[2]}</td></tr></table>
      <h3>3. Тапсырмалар бойынша орындалуы</h3>
      <table><tr><th>№</th><th>Дескриптор</th><th>Орындады, %</th></tr>${st.descPct.map((d) => `<tr><td>${d.task}</td><td>${esc(d.text)}</td><td>${d.pct}</td></tr>`).join('')}</table>
      <h3>4. Қорытынды</h3><p>${esc(a.summary)}</p>
      <p><b>Жақсы меңгерілген:</b></p><ul>${a.strengths.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p><b>Қиындық тудырған:</b></p><ul>${a.difficulties.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>5. Ұсыныстар және түзету жұмысы</h3><ol>${a.recommendations.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      ${a.individual.length ? `<h3>6. Жеке түзету жұмысының жоспары</h3><table><tr><th>№</th><th>Оқушы</th><th>Анықталған қиындық</th><th>Қайталайтын тапсырма</th><th>Мерзімі</th></tr>${a.individual.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.student)}</td><td>${esc(x.difficulty)}</td><td>${esc(x.task)}</td><td></td></tr>`).join('')}</table>` : ''}
      <p class="sign">Мұғалім: ____________________          ОІЖО: ____________________</p>
    </section>`;
    $('#r-doc').classList.remove('hidden');
    $('#r-doc-body').innerHTML = anlHTML;
    status(stEl, 'Дайын. Мәтінді тексеріп, басып шығарыңыз немесе Word-қа сақтаңыз.');
  } catch (e) {
    status(stEl, e.message, 'err');
  }
});
$('#r-print').addEventListener('click', () => printHTML(anlHTML));
$('#r-word').addEventListener('click', () => downloadWord('АКР-анықтама-талдау.doc', anlHTML));

// =====================================================================
// 4. БАПТАУЛАР
// =====================================================================
$('#s-key').value = settings.key;
$('#s-model').value = settings.model;
$('#s-school').value = settings.school;
$('#s-save').addEventListener('click', () => {
  settings = { key: $('#s-key').value.trim(), model: $('#s-model').value, school: $('#s-school').value.trim() };
  store.set('akr.settings', settings);
  status($('#s-status'), 'Сақталды.');
});

// =====================================================================
// Көмекші функциялар
// =====================================================================
function fileToBase64(f) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

// Фотоны 2000 px-ке дейін кішірейтіп, JPEG-ке айналдыру (жылдам әрі арзан).
async function downscale(file, max = 2000) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85).split(',')[1];
}

function download(name, data, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// SVG суреттерді PNG-ге айналдырып, Word ашатын .doc (HTML) файл жасау.
async function downloadWord(name, html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  for (const img of div.querySelectorAll('img')) {
    try { img.src = await svgToPng(img.src); } catch { img.remove(); }
  }
  const css = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; } })
    .filter((t) => /^\.(page|task|tn|tp|passage|opts|item|vbadge|hint|sheet-head|bub|atask|atitle|aitem|ans|grid|bx|boxes|mk|score|sol|note|small)/.test(t)).join('\n');
  const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>${css}
    table{border-collapse:collapse} td,th{border:1px solid #555;padding:3px 5px} .mk{display:none}</style></head><body>${div.innerHTML.replace(/<section class="page[^"]*">/g, (m) => `<br style="page-break-before:always">${m}`)}</body></html>`;
  download(name, '﻿' + doc, 'application/msword');
}
function svgToPng(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const w = im.naturalWidth || 600, h = im.naturalHeight || 300, k = 600 / Math.max(w, 1);
      const c = document.createElement('canvas');
      c.width = 600; c.height = Math.max(1, Math.round(h * k));
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/png'));
    };
    im.onerror = rej;
    im.src = src;
  });
}

// ---------- Іске қосу ----------
fillSubjects(); fillSources(); fillPoints(); renderPassportList(); showCost();
// index.html#check — телефонда бірден тексеру бетін ашу үшін
const startTab = settings.key ? location.hash.slice(1) : 'settings';
document.querySelector(`nav [data-tab="${startTab}"]`)?.click();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
