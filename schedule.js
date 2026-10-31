// БЖБ/ТЖБ (СОР/СОЧ) және бақылау жұмыстарының кестесі — ортақ қозғалтқыш.
// Бет window.SCHED = { mode, types, title } береді.
(function () {
  const CFG = window.SCHED;
  const KEY = 'mt-sched-' + CFG.mode;
  const $ = id => document.getElementById(id);
  const t = k => App.t(k), L = o => App.tx(o), esc = App.esc;

  const SUBJECTS = {
    kk: ['Қазақ тілі', 'Қазақ әдебиеті', 'Орыс тілі мен әдебиеті', 'Ағылшын тілі', 'Математика', 'Алгебра', 'Геометрия', 'Информатика', 'Жаратылыстану', 'Физика', 'Химия', 'Биология', 'География', 'Қазақстан тарихы', 'Дүниежүзі тарихы', 'Құқық негіздері'],
    ru: ['Русский язык', 'Литература', 'Казахский язык и литература', 'Английский язык', 'Математика', 'Алгебра', 'Геометрия', 'Информатика', 'Естествознание', 'Физика', 'Химия', 'Биология', 'География', 'История Казахстана', 'Всемирная история', 'Основы права'],
    en: ['Kazakh language', 'Russian language', 'English', 'Mathematics', 'Algebra', 'Geometry', 'Computer science', 'Science', 'Physics', 'Chemistry', 'Biology', 'Geography', 'History of Kazakhstan', 'World history', 'Law']
  };
  const TERMS = [1, 2, 3, 4];
  const WD = { kk: ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'], ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
  // ҚР ОАМ бұйрығы бойынша 2026–2027 оқу жылы
  const DEF_TERMS = { 1: ['2026-09-01', '2026-10-25'], 2: ['2026-11-02', '2026-12-27'], 3: ['2027-01-11', '2027-03-21'], 4: ['2027-03-29', '2027-05-25'] };

  function blank() {
    return { school: '', year: '2026-2027', term: 1, classes: [], subjects: [], terms: DEF_TERMS, cells: {}, maxDay: 2 };
  }
  let D = App.store.get(KEY) || blank();
  let readonly = false;
  const save = () => { if (!readonly) App.store.set(KEY, D); };
  const ck = (term, s, c) => term + '|' + s + '|' + c;
  const gradeOf = c => parseInt(c, 10) || 0;
  // 2–4 сыныпқа тек аралық бағалау, 5–11-ге БЖБ/ТЖБ (type.grades бойынша)
  const allowed = c => CFG.types.filter(ty => !ty.grades || !gradeOf(c) || ty.grades.includes(gradeOf(c)));
  const typeOf = id => CFG.types.find(x => x.id === id) || CFG.types[0];
  const fmtD = d => d ? d.slice(8, 10) + '.' + d.slice(5, 7) : '—';
  const fmtFull = d => d ? d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4) : '';

  // жазба белгісі: «БЖБ 2 · 21.10» — нөмір пән/сынып/тоқсан ішіндегі реті бойынша
  function label(list, k) {
    const e = list[k], ty = typeOf(e.type);
    let n = '';
    if (ty.numbered) {
      const same = list.filter(x => x.type === e.type);
      if (same.length > 1 || ty.alwaysNum) n = ' ' + (same.indexOf(e) + 1);
    }
    return L(ty.short) + n;
  }
  function sorted(list) { return list.slice().sort((a, b) => (a.d || '9').localeCompare(b.d || '9')); }

  // ---- тексеру: бір сыныпта бір күнде шектен тыс, тоқсаннан тыс, жексенбі
  function problems() {
    const out = [], perDay = {}, flags = {};
    for (const s of D.subjects) for (const c of D.classes) {
      const list = D.cells[ck(D.term, s, c)] || [];
      for (const e of list) {
        if (!e.d) continue;
        const k = c + '|' + e.d;
        (perDay[k] = perDay[k] || []).push({ s, e });
        const [a, b] = D.terms[D.term] || [];
        if (a && b && (e.d < a || e.d > b)) { out.push({ lvl: 'warn', msg: c + ' · ' + s + ' · ' + fmtFull(e.d) + ' — ' + t('outTerm') }); flags[ck(D.term, s, c)] = 'warn'; }
        if (new Date(e.d + 'T12:00').getDay() === 0) { out.push({ lvl: 'warn', msg: c + ' · ' + s + ' · ' + fmtFull(e.d) + ' — ' + t('sunday') }); flags[ck(D.term, s, c)] = 'warn'; }
      }
    }
    for (const k in perDay) {
      const arr = perDay[k], [c, d] = k.split('|');
      const big = arr.filter(x => typeOf(x.e.type).big).length;
      if (arr.length > D.maxDay || big > 1) {
        out.push({ lvl: 'err', msg: c + ' · ' + fmtFull(d) + ' — ' + arr.length + ' ' + t('perDay') + ' (' + arr.map(x => x.s).join(', ') + ')' });
        arr.forEach(x => { flags[ck(D.term, x.s, c)] = 'err'; });
      }
    }
    return { out, flags };
  }

  // ---- кесте
  function renderGrid() {
    const { out, flags } = problems();
    const cls = D.classes;
    let h = '<table class="grid"><thead><tr><th class="sticky">' + t('subject') + ' \\ ' + t('class') + '</th>' + cls.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>';
    D.subjects.forEach((s, si) => {
      h += '<tr><th class="sticky">' + esc(s) + (readonly ? '' : ' <button class="fill" data-fill="' + si + '" title="' + esc(t('fillRow')) + '">⚡</button>') + '</th>';
      cls.forEach((c, ci) => {
        const list = sorted(D.cells[ck(D.term, s, c)] || []);
        const f = flags[ck(D.term, s, c)];
        h += '<td class="cell ' + (f || '') + (readonly ? ' ro' : '') + '" data-s="' + si + '" data-c="' + ci + '">' +
          (list.length ? list.map((e, k) => '<span class="chip t-' + e.type + '"><b>' + esc(label(list, k)) + '</b> ' + fmtD(e.d) + '</span>').join('') : (readonly ? '' : '<span class="plus">+</span>')) + '</td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table>';
    $('gridBox').innerHTML = cls.length && D.subjects.length ? h : '<p class="muted">' + t('emptyGrid') + '</p>';
    $('probs').innerHTML = out.length
      ? '<b>' + t('problems') + ' (' + out.length + ')</b><ul>' + out.map(p => '<li class="' + p.lvl + '">' + esc(p.msg) + '</li>').join('') + '</ul>'
      : '<span class="ok">✓ ' + t('noProblems') + '</span>';
    renderStats();
  }
  function renderStats() {
    let n = 0, filled = 0;
    const by = {};
    for (const s of D.subjects) for (const c of D.classes) {
      const list = D.cells[ck(D.term, s, c)] || [];
      n += list.length; if (list.length && list.every(e => e.d)) filled++;
      list.forEach(e => { by[e.type] = (by[e.type] || 0) + 1; });
    }
    $('stats').innerHTML = CFG.types.map(ty => '<span class="chip t-' + ty.id + '"><b>' + esc(L(ty.short)) + '</b> ' + (by[ty.id] || 0) + '</span>').join('') +
      '<span class="muted">' + t('total') + ': ' + n + '</span>';
  }

  // ---- сынып / пән / күн бойынша тізім
  function rowsFor(filter) {
    const rows = [];
    for (const term of TERMS) for (const s of D.subjects) for (const c of D.classes) {
      const list = sorted(D.cells[ck(term, s, c)] || []);
      list.forEach((e, k) => { if (filter(term, s, c, e)) rows.push({ term, s, c, e, lab: label(list, k) }); });
    }
    return rows.sort((a, b) => (a.e.d || '9').localeCompare(b.e.d || '9'));
  }
  function listTable(rows, cols) {
    if (!rows.length) return '<p class="muted">' + t('nothing') + '</p>';
    const today = new Date().toISOString().slice(0, 10);
    return '<table class="list"><thead><tr><th>' + t('date') + '</th><th>' + t('weekday') + '</th>' + cols.map(c => '<th>' + t(c) + '</th>').join('') + '<th>' + t('type') + '</th><th>' + t('note') + '</th></tr></thead><tbody>' +
      rows.map(r => '<tr class="' + (r.e.d && r.e.d < today ? 'past' : '') + '"><td><b>' + (fmtFull(r.e.d) || '—') + '</b></td><td>' + (r.e.d ? WD[App.lang][new Date(r.e.d + 'T12:00').getDay()] : '') + '</td>' +
        cols.map(c => '<td>' + esc(c === 'class' ? r.c : c === 'subject' ? r.s : r.term) + '</td>').join('') +
        '<td><span class="chip t-' + r.e.type + '"><b>' + esc(r.lab) + '</b></span> ' + esc(L(typeOf(r.e.type).name)) + '</td><td>' + esc(r.e.note || '') + '</td></tr>').join('') + '</tbody></table>';
  }
  function renderLists() {
    const pickC = $('pickClass'), pickS = $('pickSubj');
    const cv = pickC.value, sv = pickS.value;
    pickC.innerHTML = D.classes.map(c => '<option>' + esc(c) + '</option>').join('');
    pickS.innerHTML = D.subjects.map(s => '<option>' + esc(s) + '</option>').join('');
    if (D.classes.includes(cv)) pickC.value = cv;
    if (D.subjects.includes(sv)) pickS.value = sv;
    const allT = $('allTerms').checked;
    $('byClass').innerHTML = listTable(rowsFor((term, s, c) => c === pickC.value && (allT || term === D.term)), ['subject'].concat(allT ? ['term'] : []));
    $('bySubj').innerHTML = listTable(rowsFor((term, s) => s === pickS.value && (allT || term === D.term)), ['class'].concat(allT ? ['term'] : []));
    $('byDate').innerHTML = listTable(rowsFor(term => allT || term === D.term), ['class', 'subject'].concat(allT ? ['term'] : []));
  }
  function renderHead() {
    $('hSchool').textContent = D.school || '';
    $('hTitle').textContent = L(CFG.title) + ' · ' + D.year + ' · ' + D.term + ' ' + t('termWord');
    document.querySelectorAll('#terms button').forEach(b => b.classList.toggle('on', +b.dataset.t === D.term));
  }
  // ---- жылдам баптау: сыныптар мен пәндер чиптері
  function renderQuick() {
    $('qClasses').innerHTML = D.classes.map((c, i) => '<span class="qchip">' + esc(c) + '<button data-rc="' + i + '">✕</button></span>').join('') || '<span class="muted">' + t('noClasses') + '</span>';
    $('qSubjects').innerHTML = D.subjects.map((s, i) => '<span class="qchip">' + esc(s) + '<button data-rs="' + i + '">✕</button></span>').join('') || '<span class="muted">' + t('noSubjects') + '</span>';
    $('subjList').innerHTML = SUBJECTS[App.lang].map(s => '<option value="' + esc(s) + '">').join('');
    $('stdList').innerHTML = SUBJECTS[App.lang].map(s => '<button class="btn sm' + (D.subjects.includes(s) ? ' on' : '') + '" data-std="' + esc(s) + '">' + (D.subjects.includes(s) ? '✓ ' : '+ ') + esc(s) + '</button>').join('');
    $('quick').open = !D.classes.length || !D.subjects.length || $('quick').open;
  }
  function addClasses(v) {
    const toks = splitList(v.replace(/\s+/g, ','));
    const letters = (App.lang === 'ru' ? 'АБВГДЕ' : 'АӘБВГД').split('');
    toks.forEach(x => { if (/^\d+$/.test(x)) letters.slice(0, 4).forEach(l => D.classes.push(x + l)); else D.classes.push(x.toUpperCase()); });
    D.classes = [...new Set(D.classes)].sort((a, b) => gradeOf(a) - gradeOf(b) || a.localeCompare(b, 'kk'));
    save(); renderAll();
  }
  function bindQuick() {
    $('qcForm').onsubmit = e => { e.preventDefault(); addClasses($('qcIn').value); $('qcIn').value = ''; $('qcIn').focus(); };
    $('qsForm').onsubmit = e => { e.preventDefault(); const v = $('qsIn').value.trim(); if (v) { D.subjects = [...new Set(D.subjects.concat(splitList(v)))]; save(); renderAll(); } $('qsIn').value = ''; $('qsIn').focus(); };
    $('quick').onclick = e => {
      const rc = e.target.closest('[data-rc]'), rs = e.target.closest('[data-rs]'), std = e.target.closest('[data-std]');
      if (rc) D.classes.splice(+rc.dataset.rc, 1);
      else if (rs) D.subjects.splice(+rs.dataset.rs, 1);
      else if (std) { const v = std.dataset.std; D.subjects = D.subjects.includes(v) ? D.subjects.filter(x => x !== v) : D.subjects.concat(v); }
      else if (e.target.id === 'stdBtn') { $('stdList').classList.toggle('hide'); return; }
      else return;
      save(); renderAll();
    };
  }
  function renderAll() { renderHead(); renderQuick(); renderGrid(); renderLists(); fillSettings(); }

  // <dialog> жоқ ескі браузерлер үшін қарапайым терезе
  function openDlg() { const d = $('dlg'); if (d.showModal) { try { d.showModal(); return; } catch (e) {} } d.setAttribute('open', ''); d.classList.add('fallback'); }
  function closeDlg() { const d = $('dlg'); if (d.close && !d.classList.contains('fallback')) d.close(); else { d.removeAttribute('open'); d.classList.remove('fallback'); } }
  // ---- ұяшық редакторы
  let edit = null;
  function openCell(si, ci, all) {
    if (readonly) return;
    const s = D.subjects[si], c = D.classes[ci];
    edit = { s, c, all, list: JSON.parse(JSON.stringify(D.cells[ck(D.term, s, c)] || [])) };
    $('dlgTitle').textContent = s + ' · ' + (all ? t('allClasses') : c) + ' · ' + D.term + ' ' + t('termWord');
    $('dlgAll').checked = !!all; $('dlgAllAll').checked = !!all; $('dlgAllAll').disabled = !all;
    $('dlgCopy').classList.toggle('hide', !!all);
    const types = all ? CFG.types : allowed(c);
    edit.list = edit.list.filter(e => types.some(ty => ty.id === e.type));
    edit.types = types;
    $('dlgAddBtns').innerHTML = types.map(ty => '<button type="button" class="btn sm" data-add="' + ty.id + '">+ ' + esc(L(ty.name)) + '</button>').join('');
    renderDlg();
    openDlg();
  }
  function renderDlg() {
    $('dlgList').innerHTML = edit.list.length ? edit.list.map((e, i) =>
      '<div class="erow"><select data-k="type" data-i="' + i + '">' + edit.types.map(ty => '<option value="' + ty.id + '"' + (ty.id === e.type ? ' selected' : '') + '>' + esc(L(ty.name)) + '</option>').join('') + '</select>' +
      '<input type="date" data-k="d" data-i="' + i + '" value="' + (e.d || '') + '">' +
      '<input type="text" data-k="note" data-i="' + i + '" value="' + esc(e.note || '') + '" placeholder="' + esc(t('notePh')) + '">' +
      '<button type="button" class="btn sm" data-del="' + i + '">✕</button></div>').join('') : '<p class="muted">' + t('noEntries') + '</p>';
  }
  function bindDlg() {
    $('dlgAddBtns').onclick = e => {
      const b = e.target.closest('[data-add]'); if (!b) return;
      const last = edit.list[edit.list.length - 1];
      edit.list.push({ type: b.dataset.add, d: last && last.d ? '' : '' });
      renderDlg();
      const ins = $('dlgList').querySelectorAll('input[type=date]'); if (ins.length) ins[ins.length - 1].focus();
    };
    $('dlgList').oninput = e => { const el = e.target; if (el.dataset.k) edit.list[+el.dataset.i][el.dataset.k] = el.value; };
    $('dlgList').onchange = $('dlgList').oninput;
    $('dlgList').onclick = e => { const b = e.target.closest('[data-del]'); if (b) { edit.list.splice(+b.dataset.del, 1); renderDlg(); } };
    $('dlgSave').onclick = () => {
      const list = edit.list.filter(e => e.type);
      const targets = $('dlgAll').checked ? D.classes.filter(c => c.slice(0, -1) === edit.c.slice(0, -1) || $('dlgAllAll').checked) : [edit.c];
      targets.forEach(c => {
        const ok = allowed(c).map(ty => ty.id);
        const own = list.filter(e => ok.includes(e.type));
        if (edit.all && !own.length) return;
        if (own.length) D.cells[ck(D.term, edit.s, c)] = JSON.parse(JSON.stringify(own));
        else delete D.cells[ck(D.term, edit.s, c)];
      });
      save(); closeDlg(); renderGrid(); renderLists();
    };
    $('dlgCancel').onclick = closeDlg;
    $('dlgAll').onchange = () => { $('dlgAllAll').disabled = !$('dlgAll').checked; };
  }

  // ---- баптаулар
  const splitList = v => v.split(/[\n,;]+/).map(x => x.trim()).filter(Boolean);
  function fillSettings() {
    $('sSchool').value = D.school; $('sYear').value = D.year; $('sMax').value = D.maxDay;
    $('sClasses').value = D.classes.join(', ');
    $('sSubjects').value = D.subjects.join('\n');
    $('sTerms').innerHTML = TERMS.map(n => '<div class="row"><b style="width:90px">' + n + ' ' + t('termWord') + '</b><input type="date" data-tf="' + n + ':0" value="' + ((D.terms[n] || [])[0] || '') + '"> — <input type="date" data-tf="' + n + ':1" value="' + ((D.terms[n] || [])[1] || '') + '"></div>').join('');
  }
  function bindSettings() {
    $('sSchool').oninput = () => { D.school = $('sSchool').value; save(); renderHead(); };
    $('sYear').oninput = () => { D.year = $('sYear').value; save(); renderHead(); };
    $('sMax').oninput = () => { D.maxDay = Math.max(1, +$('sMax').value || 2); save(); renderGrid(); };
    $('sClasses').onchange = () => { D.classes = [...new Set(splitList($('sClasses').value))]; save(); renderAll(); };
    $('sSubjects').onchange = () => { D.subjects = [...new Set(splitList($('sSubjects').value))]; save(); renderAll(); };
    $('sTerms').onchange = e => { const [n, i] = (e.target.dataset.tf || '').split(':'); if (!n) return; D.terms[n] = D.terms[n] || ['', '']; D.terms[n][+i] = e.target.value; save(); renderGrid(); };
    $('addStd').onclick = () => { D.subjects = [...new Set(D.subjects.concat(SUBJECTS[App.lang]))]; save(); renderAll(); };
    $('genCls').onclick = () => {
      const g = prompt(t('genPrompt'), '5'); if (!g) return;
      const letters = (App.lang === 'ru' ? 'АБВГДЕЖЗ' : App.lang === 'en' ? 'ABCDEFGH' : 'АӘБВГДЕЖ').split('');
      const n = Math.min(8, Math.max(1, +prompt(t('genCount'), '4') || 4));
      D.classes = [...new Set(D.classes.concat(g.split(/[ ,]+/).filter(Boolean).reduce((acc, gr) => acc.concat(letters.slice(0, n).map(l => gr + l)), [])))];
      save(); renderAll();
    };
    $('resetAll').onclick = () => { const old = JSON.stringify(D); D = blank(); save(); renderAll(); App.toast(t('doneClear'), () => { D = JSON.parse(old); save(); renderAll(); }); };
  }

  // ---- экспорт / импорт / бөлісу
  function download(name, text, mime) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportCsv() {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = [[t('subject')].concat(D.classes)];
    D.subjects.forEach(s => rows.push([s].concat(D.classes.map(c => {
      const list = sorted(D.cells[ck(D.term, s, c)] || []);
      return list.map((e, k) => label(list, k) + ' ' + fmtFull(e.d)).join('\n');
    }))));
    const head = [[D.school], [L(CFG.title) + ' ' + D.year + ', ' + D.term + ' ' + t('termWord')], []];
    download((CFG.mode === 'sor' ? 'SOR-SOCH' : 'tests') + '-' + D.term + '.csv', '﻿' + head.concat(rows).map(r => r.map(q).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
  }
  async function pack(obj) {
    const json = JSON.stringify(obj);
    try {
      const cs = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const buf = new Uint8Array(await new Response(cs).arrayBuffer());
      let bin = ''; buf.forEach(b => { bin += String.fromCharCode(b); });
      return 'z' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) { return 'j' + encodeURIComponent(json); }
  }
  async function unpack(s) {
    if (s[0] === 'j') return JSON.parse(decodeURIComponent(s.slice(1)));
    const b64 = s.slice(1).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return JSON.parse(await new Response(ds).text());
  }
  async function shareLink() {
    const u = new URL(location.href);
    u.hash = 'v=' + await pack(D);
    u.searchParams.set('lang', App.lang);
    const link = u.toString();
    $('shareOut').value = link; $('shareBox').classList.remove('hide');
    try { await navigator.clipboard.writeText(link); $('shareMsg').textContent = t('copied'); } catch (e) { $('shareMsg').textContent = ''; }
    $('shareOut').select();
  }
  function bindIO() {
    $('csv').onclick = exportCsv;
    $('print').onclick = () => print();
    $('share').onclick = shareLink;
    $('backup').onclick = () => download((CFG.mode === 'sor' ? 'SOR-SOCH' : 'tests') + '-backup.json', JSON.stringify(D, null, 1), 'application/json');
    $('restore').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(txt => { const o = JSON.parse(txt); if (!o.cells || !o.classes) throw 0; D = Object.assign(blank(), o); save(); renderAll(); })
        .catch(() => alert(t('badFile')));
      e.target.value = '';
    };
    $('keep').onclick = () => {
      if (App.store.get(KEY)) App.store.set(KEY + '-backup', App.store.get(KEY));
      readonly = false; App.store.set(KEY, D); location.hash = ''; location.reload();
    };
  }

  function bindViews() {
    document.querySelector('#views').onclick = e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      document.querySelectorAll('#views .btn').forEach(x => x.classList.toggle('on', x === b));
      ['grid', 'cls', 'subj', 'date', 'set'].forEach(v => $('v-' + v).classList.toggle('hide', v !== b.dataset.v));
    };
    $('terms').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; D.term = +b.dataset.t; save(); renderAll(); };
    $('gridBox').onclick = e => { const f = e.target.closest('[data-fill]'); if (f) { openCell(+f.dataset.fill, 0, true); return; } const td = e.target.closest('td.cell'); if (td) openCell(+td.dataset.s, +td.dataset.c); };
    $('pickClass').onchange = renderLists; $('pickSubj').onchange = renderLists; $('allTerms').onchange = renderLists;
  }

  async function start() {
    const m = location.hash.match(/v=([^&]+)/);
    if (m) {
      try { D = Object.assign(blank(), await unpack(m[1])); readonly = true; } catch (e) { alert(t('badLink')); }
    }
    document.body.classList.toggle('readonly', readonly);
    $('roBar').classList.toggle('hide', !readonly);
    if (readonly) { document.querySelector('[data-v="cls"]').click(); }
    renderAll();
  }
  function init() {
    $('terms').innerHTML = TERMS.map(n => '<button class="btn" data-t="' + n + '">' + n + ' <span data-i="termWord"></span></button>').join('');
    App.apply($('terms'));
    bindViews(); bindDlg(); bindSettings(); bindIO(); bindQuick();
    App.onLang.push(renderAll);
    window.addEventListener('hashchange', () => location.reload());
    start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
