// Кесте бетінің белгілемесі мен аудармалары (schedule.js алдында қосылады)
(function () {
  const CFG = window.SCHED;
  document.getElementById('app').innerHTML = `
<main class="wrap">
  <div class="card ro-bar hide no-print" id="roBar">
    <span data-i="roMsg"></span>
    <button class="btn primary sm" id="keep" data-i="keep"></button>
  </div>
  <div class="phead">
    <div>
      <div class="muted" id="hSchool"></div>
      <h1 id="hTitle"></h1>
    </div>
    <div class="row no-print" id="terms"></div>
  </div>
  <div class="row no-print views" id="views">
    <button class="btn on" data-v="grid" data-i="vGrid"></button>
    <button class="btn" data-v="cls" data-i="vClass"></button>
    <button class="btn" data-v="subj" data-i="vSubj"></button>
    <button class="btn" data-v="date" data-i="vDate"></button>
    <button class="btn edit-only" data-v="set" data-i="vSet"></button>
  </div>

  <section id="v-grid">
    <div class="card">
      <div class="row no-print" style="justify-content:space-between;margin-bottom:12px">
        <div class="row" id="stats"></div>
        <span class="muted edit-only" data-i="tapCell"></span>
      </div>
      <div class="scroll" id="gridBox"></div>
      <div class="probs" id="probs"></div>
    </div>
  </section>
  <section id="v-cls" class="hide"><div class="card">
    <div class="row no-print"><b data-i="class"></b><select id="pickClass"></select><label class="row"><input type="checkbox" id="allTerms"><span data-i="allTerms"></span></label></div>
    <div class="scroll" id="byClass"></div></div></section>
  <section id="v-subj" class="hide"><div class="card">
    <div class="row no-print"><b data-i="subject"></b><select id="pickSubj"></select></div>
    <div class="scroll" id="bySubj"></div></div></section>
  <section id="v-date" class="hide"><div class="card"><div class="scroll" id="byDate"></div></div></section>

  <section id="v-set" class="hide">
    <div class="sets">
      <div class="card">
        <h3 data-i="sMain"></h3>
        <label class="fld"><span data-i="school"></span><input type="text" id="sSchool" data-ip="schoolPh"></label>
        <label class="fld"><span data-i="year"></span><input type="text" id="sYear"></label>
        <label class="fld"><span data-i="maxDay"></span><input type="number" id="sMax" min="1" max="5"></label>
        <p class="muted small" data-i="maxHint"></p>
      </div>
      <div class="card">
        <h3 data-i="classes"></h3>
        <textarea id="sClasses" rows="3" data-ip="classesPh"></textarea>
        <div class="row" style="margin-top:8px"><button class="btn sm" id="genCls" data-i="genCls"></button></div>
        <h3 style="margin-top:18px" data-i="subjects"></h3>
        <textarea id="sSubjects" rows="8" data-ip="subjectsPh"></textarea>
        <div class="row" style="margin-top:8px"><button class="btn sm" id="addStd" data-i="addStd"></button></div>
      </div>
      <div class="card">
        <h3 data-i="termDates"></h3>
        <div id="sTerms" class="tgrid"></div>
        <p class="muted small" data-i="termHint"></p>
        <h3 style="margin-top:18px" data-i="data"></h3>
        <div class="row">
          <button class="btn sm" id="backup" data-i="backup"></button>
          <label class="btn sm"><span data-i="restore"></span><input type="file" id="restore" accept=".json" hidden></label>
          <button class="btn sm red" id="resetAll" data-i="resetAll"></button>
        </div>
      </div>
    </div>
  </section>

  <div class="card no-print actions">
    <button class="btn primary" id="share" data-i="share"></button>
    <button class="btn" id="csv" data-i="csv"></button>
    <button class="btn" id="print" data-i="print"></button>
    <div class="hide share" id="shareBox"><input type="text" id="shareOut" readonly><span class="muted" id="shareMsg"></span><p class="muted small" data-i="shareHint"></p></div>
  </div>
  <div class="card no-print help"><h3 data-i="howTo"></h3><ol><li data-i="h1"></li><li data-i="h2"></li><li data-i="h3"></li><li data-i="h4"></li></ol></div>
</main>
<dialog id="dlg">
  <h3 id="dlgTitle"></h3>
  <div id="dlgList"></div>
  <div class="row" id="dlgAddBtns" style="margin:12px 0"></div>
  <label class="row small"><input type="checkbox" id="dlgAll"><span data-i="copyPar"></span></label>
  <label class="row small"><input type="checkbox" id="dlgAllAll" disabled><span data-i="copyAll"></span></label>
  <div class="row" style="justify-content:flex-end;margin-top:14px">
    <button class="btn" id="dlgCancel" data-i="cancel"></button>
    <button class="btn primary" id="dlgSave" data-i="saveBtn"></button>
  </div>
</dialog>`;

  const css = document.createElement('style');
  css.textContent = `
  .phead { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  .phead h1 { margin: 0; font-size: clamp(22px, 3.4vw, 30px); font-weight: 900; }
  #terms .btn.on, .views .btn.on { background: var(--primary); color: #fff; border-color: var(--primary); }
  .views { margin-bottom: 14px; }
  .scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table.grid { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 14px; }
  table.grid th, table.grid td { border-bottom: 1px solid var(--line); border-right: 1px solid var(--line); padding: 6px; vertical-align: top; }
  table.grid thead th { background: var(--bg); position: sticky; top: 0; font-weight: 800; min-width: 92px; }
  table.grid th.sticky { position: sticky; left: 0; background: var(--card); z-index: 1; text-align: left; min-width: 150px; max-width: 220px; font-weight: 700; }
  table.grid thead th.sticky { background: var(--bg); z-index: 2; color: var(--muted); font-size: 12px; }
  td.cell { cursor: pointer; min-width: 92px; height: 44px; }
  td.cell:hover { background: var(--primary-soft); }
  td.cell.ro { cursor: default; } td.cell.ro:hover { background: transparent; }
  td.cell.err { background: var(--red-soft); box-shadow: inset 0 0 0 2px var(--red); }
  td.cell.warn { background: var(--amber-soft); }
  .plus { color: var(--muted); opacity: .4; font-size: 18px; display: block; text-align: center; }
  .chip { display: inline-block; border-radius: 7px; padding: 2px 7px; margin: 2px 2px 2px 0; font-size: 13px; white-space: nowrap; background: var(--bg); border: 1px solid var(--line); }
  .chip.t-sor, .chip.t-kr { background: var(--primary-soft); border-color: transparent; }
  .chip.t-sor b, .chip.t-kr b { color: var(--primary); }
  .chip.t-soch, .chip.t-dict { background: var(--violet-soft); border-color: transparent; }
  .chip.t-soch b, .chip.t-dict b { color: var(--violet); }
  .chip.t-test, .chip.t-essay { background: var(--green-soft); border-color: transparent; }
  .chip.t-test b, .chip.t-essay b { color: var(--green); }
  .chip.t-lab, .chip.t-pr { background: var(--amber-soft); border-color: transparent; }
  .chip.t-lab b, .chip.t-pr b { color: var(--amber); }
  #stats { gap: 6px; }
  .probs { margin-top: 12px; font-size: 14px; }
  .probs ul { margin: 6px 0 0; padding-left: 20px; }
  .probs li.err { color: var(--red); } .probs li.warn { color: var(--amber); }
  .probs .ok { color: var(--green); font-weight: 700; }
  table.list { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 15px; }
  table.list th, table.list td { border-bottom: 1px solid var(--line); padding: 8px; text-align: left; }
  table.list th { color: var(--muted); font-size: 13px; }
  table.list tr.past { opacity: .5; }
  .sets { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .sets h3 { margin: 0 0 10px; }
  .fld { display: grid; gap: 4px; margin-bottom: 10px; font-weight: 700; }
  .tgrid { display: grid; gap: 8px; } .tgrid input { width: 140px; }
  .small { font-size: 13px; }
  .actions { margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .share { width: 100%; } .share input { width: 100%; margin-bottom: 4px; }
  .help { margin-top: 16px; } .help h3 { margin: 0 0 6px; } .help li { margin: 4px 0; }
  .ro-bar { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 14px; background: var(--amber-soft); }
  body.readonly .edit-only { display: none !important; }
  dialog { border: 1px solid var(--line); border-radius: 18px; padding: 20px; width: min(640px, calc(100vw - 32px)); background: var(--card); color: var(--text); box-shadow: 0 20px 60px rgba(0,0,0,.3); }
  dialog::backdrop { background: rgba(10, 14, 22, .45); }
  dialog h3 { margin: 0 0 12px; }
  .erow { display: grid; grid-template-columns: 1.2fr 1fr 1.2fr auto; gap: 6px; margin-bottom: 6px; }
  @media (max-width: 560px) { .erow { grid-template-columns: 1fr 1fr; } }
  @media print {
    .phead h1 { font-size: 18px; }
    table.grid { font-size: 11px; } table.grid th.sticky { position: static; }
    .chip { border: 1px solid #999 !important; background: #fff !important; }
    td.cell.err, td.cell.warn { box-shadow: none; background: #fff; }
    .plus, .probs { display: none; }
    section.hide { display: none !important; }
  }`;
  document.head.append(css);

  const D = {
    pageTitle: CFG.title,
    roMsg: { kk: 'Бұл — бөлісілген кесте (тек көру). Өз құрылғыңызға көшіріп, өңдей аласыз.', ru: 'Это общий график (только просмотр). Можно сохранить копию на своём устройстве и редактировать.', en: 'This is a shared schedule (view only). Save a copy to your device to edit it.' },
    keep: { kk: 'Көшірмесін сақтау', ru: 'Сохранить копию', en: 'Save a copy' },
    termWord: { kk: 'тоқсан', ru: 'четверть', en: 'term' },
    vGrid: { kk: '▦ Жалпы кесте', ru: '▦ Общая таблица', en: '▦ Grid' },
    vClass: { kk: '👥 Сынып бойынша', ru: '👥 По классу', en: '👥 By class' },
    vSubj: { kk: '📘 Пән бойынша', ru: '📘 По предмету', en: '📘 By subject' },
    vDate: { kk: '📅 Күн бойынша', ru: '📅 По датам', en: '📅 By date' },
    vSet: { kk: '⚙ Баптаулар', ru: '⚙ Настройки', en: '⚙ Settings' },
    tapCell: { kk: 'Ұяшықты басып, күнін қосыңыз', ru: 'Нажмите на ячейку, чтобы добавить дату', en: 'Tap a cell to add a date' },
    subject: { kk: 'Пән', ru: 'Предмет', en: 'Subject' },
    class: { kk: 'Сынып', ru: 'Класс', en: 'Class' },
    term: { kk: 'Тоқсан', ru: 'Четверть', en: 'Term' },
    date: { kk: 'Күні', ru: 'Дата', en: 'Date' },
    weekday: { kk: 'Апта күні', ru: 'День', en: 'Day' },
    type: { kk: 'Түрі', ru: 'Вид', en: 'Type' },
    note: { kk: 'Ескерту', ru: 'Примечание', en: 'Note' },
    notePh: { kk: 'Тақырып / бөлім', ru: 'Тема / раздел', en: 'Topic / unit' },
    total: { kk: 'Барлығы', ru: 'Всего', en: 'Total' },
    allTerms: { kk: 'Барлық тоқсан', ru: 'Все четверти', en: 'All terms' },
    nothing: { kk: 'Әзірге жазба жоқ.', ru: 'Пока записей нет.', en: 'No entries yet.' },
    emptyGrid: { kk: 'Алдымен «Баптаулар» бөлімінде сыныптар мен пәндерді енгізіңіз.', ru: 'Сначала укажите классы и предметы в «Настройках».', en: 'First add classes and subjects in Settings.' },
    problems: { kk: 'Назар аударыңыз', ru: 'Обратите внимание', en: 'Check these' },
    noProblems: { kk: 'Қайшылық жоқ', ru: 'Накладок нет', en: 'No clashes' },
    perDay: { kk: 'жұмыс бір күнде', ru: 'работ(ы) в один день', en: 'assessments on one day' },
    outTerm: { kk: 'тоқсан мерзімінен тыс', ru: 'вне сроков четверти', en: 'outside the term dates' },
    sunday: { kk: 'жексенбі', ru: 'воскресенье', en: 'Sunday' },
    sMain: { kk: 'Негізгі', ru: 'Основное', en: 'General' },
    school: { kk: 'Мектеп', ru: 'Школа', en: 'School' },
    schoolPh: { kk: 'Мектеп атауы', ru: 'Название школы', en: 'School name' },
    year: { kk: 'Оқу жылы', ru: 'Учебный год', en: 'School year' },
    maxDay: { kk: 'Бір сыныпқа күніне ең көп жұмыс', ru: 'Максимум работ в день на класс', en: 'Max assessments per class per day' },
    maxHint: { kk: 'Одан көп болса немесе бір күнде екі ' + (CFG.mode === 'sor' ? 'ТЖБ' : 'бақылау жұмысы') + ' болса, кесте қызылмен белгілейді.', ru: 'Если больше, или два ' + (CFG.mode === 'sor' ? 'СОЧ' : 'контрольных') + ' в один день — ячейка подсветится красным.', en: 'If exceeded, or two ' + (CFG.mode === 'sor' ? 'term assessments' : 'tests') + ' fall on one day, the cell turns red.' },
    classes: { kk: 'Сыныптар', ru: 'Классы', en: 'Classes' },
    classesPh: { kk: '5А, 5Ә, 5Б, 6А…', ru: '5А, 5Б, 5В, 6А…', en: '5A, 5B, 6A…' },
    genCls: { kk: '+ Параллель қосу', ru: '+ Добавить параллель', en: '+ Add grade' },
    genPrompt: { kk: 'Сынып(тар) нөмірі: мысалы 5 немесе 5 6 7', ru: 'Номер(а) классов: например 5 или 5 6 7', en: 'Grade number(s): e.g. 5 or 5 6 7' },
    genCount: { kk: 'Әр параллельде неше сынып? (1–8)', ru: 'Сколько классов в параллели? (1–8)', en: 'How many classes per grade? (1–8)' },
    subjects: { kk: 'Пәндер (әр жолға біреу)', ru: 'Предметы (по одному в строке)', en: 'Subjects (one per line)' },
    subjectsPh: { kk: 'Математика\nҚазақ тілі', ru: 'Математика\nРусский язык', en: 'Mathematics\nEnglish' },
    addStd: { kk: '+ Стандартты пәндер', ru: '+ Стандартные предметы', en: '+ Standard subjects' },
    termDates: { kk: 'Тоқсан мерзімдері', ru: 'Сроки четвертей', en: 'Term dates' },
    termHint: { kk: 'Мектеп бұйрығы бойынша түзетіңіз. Мерзімнен тыс күндер сарымен белгіленеді.', ru: 'Исправьте по приказу школы. Даты вне сроков подсвечиваются жёлтым.', en: 'Adjust to your school calendar. Dates outside a term are highlighted.' },
    data: { kk: 'Деректер', ru: 'Данные', en: 'Data' },
    backup: { kk: '⬇ Сақтық көшірме', ru: '⬇ Резервная копия', en: '⬇ Backup' },
    restore: { kk: '⬆ Файлдан жүктеу', ru: '⬆ Загрузить из файла', en: '⬆ Restore' },
    resetAll: { kk: 'Барлығын өшіру', ru: 'Удалить всё', en: 'Delete all' },
    sureReset: { kk: 'Барлық деректер өшіріледі. Сенімдісіз бе?', ru: 'Все данные будут удалены. Вы уверены?', en: 'All data will be deleted. Are you sure?' },
    sureReplace: { kk: 'Құрылғыңыздағы кесте ауыстырылады. Жалғастырасыз ба?', ru: 'График на вашем устройстве будет заменён. Продолжить?', en: 'Your saved schedule will be replaced. Continue?' },
    badFile: { kk: 'Файл дұрыс емес.', ru: 'Неверный файл.', en: 'Invalid file.' },
    badLink: { kk: 'Сілтеме бүлінген.', ru: 'Ссылка повреждена.', en: 'The link is broken.' },
    share: { kk: '🔗 Сілтеме арқылы бөлісу', ru: '🔗 Поделиться ссылкой', en: '🔗 Share link' },
    csv: { kk: '⬇ Excel (CSV)', ru: '⬇ Excel (CSV)', en: '⬇ Excel (CSV)' },
    print: { kk: '🖨 Басып шығару / PDF', ru: '🖨 Печать / PDF', en: '🖨 Print / PDF' },
    copied: { kk: 'Көшірілді ✓', ru: 'Скопировано ✓', en: 'Copied ✓' },
    shareHint: { kk: 'Сілтемені WhatsApp/Telegram-ға жіберіңіз: ата-ана мен оқушы «Сынып бойынша» кестені көреді. Өзгерткен соң жаңа сілтеме жіберіңіз.', ru: 'Отправьте ссылку в WhatsApp/Telegram: родители и ученики увидят график своего класса. После изменений отправьте новую ссылку.', en: 'Send the link via WhatsApp/Telegram: parents and students will see their class schedule. After changes, send a new link.' },
    howTo: { kk: 'Қалай қолдану керек?', ru: 'Как пользоваться?', en: 'How to use' },
    h1: { kk: '«Баптаулар»: мектеп, сыныптар, пәндер, тоқсан мерзімдері.', ru: '«Настройки»: школа, классы, предметы, сроки четвертей.', en: 'Settings: school, classes, subjects, term dates.' },
    h2: { kk: 'Тоқсанды таңдап, кестедегі ұяшықты басыңыз да, жұмыс түрі мен күнін қосыңыз. «Параллельге көшіру» — уақыт үнемдейді.', ru: 'Выберите четверть, нажмите ячейку и добавьте вид работы и дату. «Копировать на параллель» экономит время.', en: 'Pick a term, tap a cell and add the type and date. "Copy to the same grade" saves time.' },
    h3: { kk: 'Қызыл ұяшық — бір сыныпта бір күнге тым көп жұмыс; сары — тоқсаннан тыс не жексенбі.', ru: 'Красная ячейка — слишком много работ у класса в один день; жёлтая — вне четверти или воскресенье.', en: 'Red cell — too many assessments for a class on one day; yellow — outside the term or on Sunday.' },
    h4: { kk: 'Дайын кестені басып шығарыңыз, Excel-ге жүктеңіз немесе сілтемемен бөлісіңіз. Деректер тек сіздің браузеріңізде сақталады.', ru: 'Готовый график распечатайте, скачайте в Excel или отправьте ссылкой. Данные хранятся только в вашем браузере.', en: 'Print it, download for Excel or share a link. Data is stored only in your browser.' },
    copyPar: { kk: 'Осы параллельдің барлық сыныбына көшіру', ru: 'Копировать на все классы этой параллели', en: 'Copy to all classes of this grade' },
    copyAll: { kk: '…немесе барлық сыныпқа', ru: '…или на все классы', en: '…or to all classes' },
    noEntries: { kk: 'Төмендегі батырмамен жұмыс қосыңыз.', ru: 'Добавьте работу кнопкой ниже.', en: 'Add an entry with a button below.' },
    cancel: { kk: 'Болдырмау', ru: 'Отмена', en: 'Cancel' },
    saveBtn: { kk: 'Сақтау', ru: 'Сохранить', en: 'Save' }
  };
  App.init(Object.assign(D, CFG.dict || {}));
})();
