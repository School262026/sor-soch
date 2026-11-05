// АКР паспортынан басып шығаруға арналған беттерді жасау.

export const L = {
  kk: {
    spec: 'ӘКІМШІЛІК БАҚЫЛАУ ЖҰМЫСЫНЫҢ СПЕЦИФИКАЦИЯСЫ', goal: 'Мақсаты', topics: 'Қамтылатын тақырыптар',
    time: 'Орындау уақыты: 40 минут', total: 'Жалпы балл', variants: 'Нұсқа саны: 2 (құрылымы бірдей, мазмұны әртүрлі)',
    specCols: ['№', 'Бөлім / тақырып', 'Тексерілетін оқу мақсаты', 'Код (КТЖ)', 'Деңгей', 'Балл'],
    sum: 'Барлығы', levels: 'Ойлау дағдыларының деңгейі бойынша балл үлесі', levelCols: ['Деңгей', 'Балл', 'Үлесі'],
    lv: { low: 'Т', mid: 'О', high: 'Ж' },
    lvName: { low: 'Т — білу және түсіну', mid: 'О — қолдану', high: 'Ж — жоғары деңгей дағдылары (талдау, жинақтау, бағалау)' },
    ach: 'Оқу жетістіктерінің деңгейі', achCols: ['Деңгей', 'Пайыз', 'Балл', 'Баға (2–4 сынып)'],
    achRows: [['Төмен', '0–39%', '«2»'], ['Орташа', '40–84%', '«3» (40–64%), «4» (65–84%)'], ['Жоғары', '85–100%', '«5»']],
    name: 'Аты-жөні', cls: 'Сынып', date: 'Күні', task: 'тапсырма', pts: 'балл', minutes: 'Уақыты: 40 минут',
    toAnswer: 'Жауабыңды жауап парағына жаз. Тест сұрағында дұрыс жауаптың дөңгелекшесін толық боя.',
    answerSheet: 'ЖАУАП ПАРАҒЫ', grid: '1 клетка = 1 см', fill: 'Дұрыс жауаптың дөңгелекшесін толық боя: ●',
    scoreRow: ['Тапсырма', 'Ең жоғары балл', 'Алған балл'],
    desc: 'БАҒАЛАУ КРИТЕРИЙЛЕРІ МЕН ДЕСКРИПТОРЛАР', descNote: 'Әр дескриптор 1 балл. Шарт толық орындалса — 1, орындалмаса — 0. Жартылай балл қойылмайды. Кілтте берілмеген, бірақ дұрыс жауаптар қабылданады.',
    descCols: ['№', 'Бағалау критерийі', 'Дескриптор (білім алушы…)', 'Тексеру', 'Деңгей', 'Балл'],
    key: 'ЖАУАП КІЛТІ (тексерушіге)', keyCols: ['Тапсырма', 'Дұрыс жауап'],
    anl: 'БАҚЫЛАУ НӘТИЖЕСІН ТАЛДАУ ПАРАҒЫ', teacher: 'Мұғалім', held: 'Өткізілген күні', count: 'Сыныптағы оқушы саны', took: 'Жұмысқа қатысқаны',
    anlCols: ['№', 'Оқушының аты-жөні', 'Нұсқа'], anlEnd: ['Барлығы', '%', 'Деңгей', 'Баға'],
    sign: 'Мұғалім: ____________________ (қолы)          ОІЖО: ____________________ (қолы)',
    letters: ['А', 'Ә', 'Б', 'В', 'Г', 'Ғ'],
  },
  ru: {
    spec: 'СПЕЦИФИКАЦИЯ АДМИНИСТРАТИВНОЙ КОНТРОЛЬНОЙ РАБОТЫ', goal: 'Цель', topics: 'Проверяемые темы',
    time: 'Время выполнения: 40 минут', total: 'Максимальный балл', variants: 'Количество вариантов: 2 (одинаковая структура, разное содержание)',
    specCols: ['№', 'Раздел / тема', 'Проверяемая цель обучения', 'Код (КТП)', 'Уровень', 'Балл'],
    sum: 'Итого', levels: 'Распределение баллов по уровням мыслительных навыков', levelCols: ['Уровень', 'Балл', 'Доля'],
    lv: { low: 'З', mid: 'П', high: 'НВП' },
    lvName: { low: 'З — знание и понимание', mid: 'П — применение', high: 'НВП — навыки высокого порядка (анализ, синтез, оценка)' },
    ach: 'Уровень учебных достижений', achCols: ['Уровень', 'Процент', 'Баллы', 'Оценка (2–4 классы)'],
    achRows: [['Низкий', '0–39%', '«2»'], ['Средний', '40–84%', '«3» (40–64%), «4» (65–84%)'], ['Высокий', '85–100%', '«5»']],
    name: 'Фамилия, имя', cls: 'Класс', date: 'Дата', task: 'Задание', pts: 'балл', minutes: 'Время: 40 минут',
    toAnswer: 'Ответы записывай в лист ответов. В тестовом вопросе полностью закрась кружок правильного ответа.',
    answerSheet: 'ЛИСТ ОТВЕТОВ', grid: '1 клетка = 1 см', fill: 'Полностью закрась кружок правильного ответа: ●',
    scoreRow: ['Задание', 'Максимальный балл', 'Получено'],
    desc: 'КРИТЕРИИ ОЦЕНИВАНИЯ И ДЕСКРИПТОРЫ', descNote: 'Каждый дескриптор — 1 балл. Условие выполнено полностью — 1, не выполнено — 0. Частичные баллы не ставятся. Верные ответы, не указанные в ключе, принимаются.',
    descCols: ['№', 'Критерий оценивания', 'Дескриптор (обучающийся…)', 'Проверка', 'Уровень', 'Балл'],
    key: 'КЛЮЧ ОТВЕТОВ (для проверяющего)', keyCols: ['Задание', 'Правильный ответ'],
    anl: 'ЛИСТ АНАЛИЗА РЕЗУЛЬТАТОВ', teacher: 'Учитель', held: 'Дата проведения', count: 'Учащихся в классе', took: 'Выполняли работу',
    anlCols: ['№', 'Фамилия, имя учащегося', 'Вариант'], anlEnd: ['Итого', '%', 'Уровень', 'Оценка'],
    sign: 'Учитель: ____________________ (подпись)          ЗДУР: ____________________ (подпись)',
    letters: ['А', 'Б', 'В', 'Г', 'Д', 'Е'],
  },
};

// «3 балл» (қаз) / «1 балл, 3 балла, 5 баллов» (орыс)
function pts(n, lang) {
  if (lang !== 'ru') return `${n} балл`;
  const d = n % 10, h = n % 100;
  return `${n} ${d === 1 && h !== 11 ? 'балл' : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'балла' : 'баллов'}`;
}

export const esc =(s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl = (s) => esc(s).replace(/\n/g, '<br>');

// SVG <img> ішінде көрсетіледі — скрипт орындалмайды.
export function svgImg(svg, cls = 'fig') {
  if (!svg || !/^\s*<svg[\s>]/i.test(svg)) return '';
  const s = svg.includes('xmlns=') ? svg : svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return `<img class="${cls}" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}">`;
}

export function taskPoints(p) {
  const m = {};
  for (const d of p.descriptors) m[d.task_n] = (m[d.task_n] || 0) + d.items.reduce((a, i) => a + i.points, 0);
  return m;
}
export const totalPoints = (p) => Object.values(taskPoints(p)).reduce((a, b) => a + b, 0);

export function levelOf(pct) { return pct < 40 ? 0 : pct < 85 ? 1 : 2; }
export function markOf(pct, grade) {
  if (Number(grade) === 1) return '—'; // 1-сыныпта баға қойылмайды
  return pct >= 85 ? 5 : pct >= 65 ? 4 : pct >= 40 ? 3 : 2;
}
function bandPoints(total) {
  const b = [[], [], []];
  for (let s = 0; s <= total; s++) b[levelOf((s / total) * 100)].push(s);
  return b.map((x) => (x.length ? `${x[0]}–${x[x.length - 1]}` : '—'));
}

function header(p, l, vName) {
  return `<div class="sheet-head">
    <div class="fields"><span>${l.name}: ________________________________</span><span>${l.cls}: ${esc(p.grade)} «___»</span><span>${l.date}: ___________</span></div>
    <h2>${esc(p.title)}</h2>
    <div class="sub">${vName ? `<b class="vbadge">${esc(vName)}</b> • ` : ''}${l.minutes} • ${l.total}: ${totalPoints(p)}</div>
  </div>`;
}

function scoreTable(p, l) {
  const tp = taskPoints(p);
  const ns = Object.keys(tp);
  return `<table class="score"><tr><th>${l.scoreRow[0]}</th>${ns.map((n) => `<th>${n}</th>`).join('')}<th>${l.sum}</th></tr>
    <tr><td>${l.scoreRow[1]}</td>${ns.map((n) => `<td>${tp[n]}</td>`).join('')}<td>${totalPoints(p)}</td></tr>
    <tr><td>${l.scoreRow[2]}</td>${ns.map(() => '<td></td>').join('')}<td></td></tr></table>`;
}

// ---------- Спецификация ----------
export function specPage(p) {
  const l = L[p.lang];
  const total = totalPoints(p);
  const lvSum = { low: 0, mid: 0, high: 0 };
  p.descriptors.forEach((d) => d.items.forEach((i) => (lvSum[i.level] += i.points)));
  const bands = bandPoints(total);
  return `<section class="page spec">
    <h2>${l.spec}</h2>
    <p class="sub">${esc(p.subjectName)} • ${p.lang === 'ru' ? `${p.grade} класс • ${p.quarter} четверть` : `${p.grade}-сынып • ${p.quarter}-тоқсан`}</p>
    <p><b>${l.goal}:</b> ${nl(p.goal)}</p>
    <p><b>${l.topics}:</b> ${nl(p.topics)}</p>
    <p>${l.time}. ${l.total}: ${total}. ${l.variants}.</p>
    <table><tr>${l.specCols.map((c) => `<th>${c}</th>`).join('')}</tr>
      ${p.spec.map((r) => `<tr><td>${r.n}</td><td>${esc(r.section)}</td><td>${esc(r.objective)}</td><td>${esc(r.code)}</td><td>${esc(r.level)}</td><td>${r.points}</td></tr>`).join('')}
      <tr><td></td><td><b>${l.sum}</b></td><td></td><td></td><td></td><td><b>${total}</b></td></tr></table>
    <h3>${l.levels}</h3>
    <table><tr>${l.levelCols.map((c) => `<th>${c}</th>`).join('')}</tr>
      ${['low', 'mid', 'high'].map((k) => `<tr><td>${l.lvName[k]}</td><td>${lvSum[k]}</td><td>${Math.round((lvSum[k] / total) * 100)}%</td></tr>`).join('')}</table>
    <h3>${l.ach}</h3>
    <table><tr>${l.achCols.map((c) => `<th>${c}</th>`).join('')}</tr>
      ${l.achRows.map((r, i) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${bands[i]}</td><td>${r[2]}</td></tr>`).join('')}</table>
  </section>`;
}

// ---------- Тапсырма парағы (түрлі түсті) ----------
export function taskPage(p, vi) {
  const l = L[p.lang];
  const v = p.variants[vi];
  return `<section class="page tasks">
    ${header(p, l, v.name)}
    <p class="hint">✏️ ${l.toAnswer}</p>
    ${v.tasks.map((t, ti) => `<div class="task c${ti % 6}">
      <div class="task-title"><span class="tn">${t.n}</span> ${esc(t.title)} <span class="tp">(${pts(t.points, p.lang)})</span></div>
      ${t.instruction ? `<div class="instr">${nl(t.instruction)}</div>` : ''}
      ${t.passage ? `<div class="passage">${nl(t.passage)}</div>` : ''}
      ${svgImg(t.figure_svg)}
      ${t.items.map((it) => `<div class="item"><b>${esc(it.label)}</b> ${nl(it.prompt)}
        ${svgImg(it.figure_svg, 'fig small')}
        ${it.kind === 'choice' ? `<div class="opts">${it.options.map((o, k) => `<span>${l.letters[k]}) ${esc(o)}</span>`).join('')}</div>` : ''}
        ${(it.kind === 'match' || it.kind === 'order') && it.options.length ? `<div class="opts col">${it.options.map((o, k) => `<span>${k + 1}. ${esc(o)}</span>`).join('')}</div>` : ''}
      </div>`).join('')}
    </div>`).join('')}
  </section>`;
}

// ---------- Жауап парағы (ақ-қара, фотоға ыңғайлы) ----------
function answerArea(it, l) {
  switch (it.kind) {
    case 'choice':
      return `<div class="bubbles">${it.options.map((_, k) => `<span class="bub"><i></i>${l.letters[k]}</span>`).join('')}</div>`;
    case 'short':
      return '<span class="ans-short"></span>';
    case 'line':
      return '<div class="ans-line"></div>';
    case 'lines':
      return '<div class="ans-line"></div>'.repeat(3);
    case 'draw':
      return `<div class="grid"><span>${l.grid}</span></div>`;
    case 'order':
    case 'match':
      return `<div class="boxes">${it.options.map((o, k) => `<span class="bx"><i></i>${k + 1}. ${esc(o.length > 40 ? o.slice(0, 38) + '…' : o)}</span>`).join('')}</div>`;
    default:
      return '<div class="ans-line"></div>';
  }
}

export function answerPage(p, vi) {
  const l = L[p.lang];
  const v = p.variants[vi];
  return `<section class="page answers">
    <i class="mk tl"></i><i class="mk tr"></i><i class="mk bl"></i><i class="mk br"></i>
    <div class="ans-top">${l.answerSheet} • <b class="vbadge big">${esc(v.name)}</b></div>
    ${header(p, l, '')}
    <p class="hint">${l.fill}</p>
    ${v.tasks.map((t) => `<div class="atask">
      <div class="atitle">${p.lang === 'ru' ? `Задание ${t.n}` : `${t.n}-${l.task}`} <small>(${pts(t.points, p.lang)})</small></div>
      ${t.items.map((it) => `<div class="aitem ${it.kind}"><b>${esc(it.label)}</b> ${answerArea(it, l)}</div>`).join('')}
    </div>`).join('')}
    ${scoreTable(p, l)}
  </section>`;
}

// ---------- Дескрипторлар және кілт ----------
export function keyPage(p) {
  const l = L[p.lang];
  const total = totalPoints(p);
  return `<section class="page key">
    <h2>${l.desc}</h2><p class="sub">${esc(p.title)}</p>
    <p class="note">${l.descNote}</p>
    <table><tr>${l.descCols.map((c) => `<th>${c}</th>`).join('')}</tr>
      ${p.descriptors.map((d) => d.items.map((i, k) => `<tr>${k === 0 ? `<td rowspan="${d.items.length}">${d.task_n}</td><td rowspan="${d.items.length}">${esc(d.criterion)}</td>` : ''}<td>${esc(i.text)}</td><td class="small">${esc(i.check)}</td><td>${l.lv[i.level]}</td><td>${i.points}</td></tr>`).join('')).join('')}
      <tr><td></td><td><b>${l.sum}</b></td><td></td><td></td><td></td><td><b>${total}</b></td></tr></table>
    ${p.variants.map((v) => `<h3>${l.key} — ${esc(v.name)}</h3>
      <table><tr>${l.keyCols.map((c) => `<th>${c}</th>`).join('')}</tr>
      ${v.tasks.map((t) => `<tr><td>${t.n}</td><td>${t.items.map((i) => `<div><b>${esc(i.label)}</b> ${esc(i.answer)}</div>`).join('')}${t.solution ? `<div class="sol">${nl(t.solution)}</div>` : ''}</td></tr>`).join('')}</table>`).join('')}
  </section>`;
}

// ---------- Бос талдау парағы ----------
export function analysisBlankPage(p) {
  const l = L[p.lang];
  const tp = taskPoints(p);
  const ns = Object.keys(tp);
  const rows = Array.from({ length: 25 }, (_, i) => `<tr><td>${i + 1}</td><td></td><td></td>${ns.map(() => '<td></td>').join('')}<td></td><td></td><td></td><td></td></tr>`).join('');
  return `<section class="page anl">
    <h2>${l.anl}</h2><p class="sub">${esc(p.title)}</p>
    <p>${l.cls}: ______  ${l.teacher}: ____________________  ${l.held}: __________<br>${l.count}: ______  ${l.took}: ______</p>
    <table class="tight"><tr>${l.anlCols.map((c) => `<th>${c}</th>`).join('')}${ns.map((n) => `<th>${n} (${tp[n]})</th>`).join('')}${l.anlEnd.map((c, i) => `<th>${i === 0 ? `${c} (${totalPoints(p)})` : c}</th>`).join('')}</tr>${rows}</table>
    <p class="sign">${l.sign}</p>
  </section>`;
}

export function allPages(p) {
  return [specPage(p), taskPage(p, 0), taskPage(p, 1), answerPage(p, 0), answerPage(p, 1), keyPage(p), analysisBlankPage(p)].join('');
}
