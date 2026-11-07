// Claude API шақырулары: АКР құрастыру, жауап парағын тексеру, талдау мәтінін жазу.
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@1.0.0';

const MODEL_DEFAULT = 'claude-opus-5-5';

function client(key) {
  if (!key) throw new Error('API кілті енгізілмеген. «Баптаулар» бөліміне кілтті жазыңыз.');
  // Кілт тек осы құрылғының браузерінде сақталады және тікелей api.anthropic.com-ға жіберіледі.
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

// ---------- JSON схемалары ----------

const str = { type: 'string' };
const int = { type: 'integer' };
const obj = (properties) => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false,
});
const arr = (items) => ({ type: 'array', items });

const ITEM = obj({
  label: str,
  prompt: str,
  kind: { type: 'string', enum: ['choice', 'short', 'line', 'lines', 'draw', 'order', 'match'] },
  options: arr(str),
  figure_svg: str,
  answer: str,
});

const TASK = obj({
  n: int,
  title: str,
  instruction: str,
  points: int,
  passage: str,
  figure_svg: str,
  items: arr(ITEM),
  solution: str,
});

export const PASSPORT_SCHEMA = obj({
  title: str,
  goal: str,
  topics: str,
  spec: arr(obj({ n: int, section: str, objective: str, code: str, level: str, points: int })),
  variants: arr(obj({ name: str, tasks: arr(TASK) })),
  descriptors: arr(obj({
    task_n: int,
    criterion: str,
    items: arr(obj({
      text: str,
      level: { type: 'string', enum: ['low', 'mid', 'high'] },
      points: int,
      check: str,
    })),
  })),
});

const GRADE_SCHEMA = obj({
  student_name: str,
  class_name: str,
  variant: str,
  legibility: { type: 'string', enum: ['good', 'fair', 'poor'] },
  results: arr(obj({
    task_n: int,
    index: int,
    met: { type: 'boolean' },
    student_answer: str,
    comment: str,
    confident: { type: 'boolean' },
  })),
  general_comment: str,
  error_work: obj({
    summary: str,
    steps: arr(obj({ skill: str, repeat: str, exercise: str })),
  }),
});

// ---------- Ортақ шақыру ----------

async function callJSON(key, model, { system, content, schema, effort, maxTokens }) {
  const c = client(key);
  const base = {
    model: model || MODEL_DEFAULT,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
    output_config: { effort, format: { type: 'json_schema', schema } },
  };
  let msg;
  try {
    // Сирек жағдайда модель сұранысты қабылдамаса, сервер басқа модельмен қайта орындайды.
    msg = await c.beta.messages
      .stream({ ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      .finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.BadRequestError && /fallback/i.test(e.message)) {
      msg = await c.messages.stream(base).finalMessage();
    } else {
      throw explain(e);
    }
  }
  if (msg.stop_reason === 'refusal') throw new Error('Модель сұранысты орындаудан бас тартты. Мәтінді өзгертіп, қайталап көріңіз.');
  if (msg.stop_reason === 'max_tokens') throw new Error('Жауап тым ұзын болып, үзіліп қалды. Тапсырма санын азайтып, қайталаңыз.');
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return { data: JSON.parse(text), usage: msg.usage };
}

function explain(e) {
  if (e instanceof Anthropic.AuthenticationError) return new Error('API кілті қате немесе жарамсыз.');
  if (e instanceof Anthropic.RateLimitError) return new Error('Сұраныс тым жиі жіберілді. Бір минуттан кейін қайталаңыз.');
  if (e instanceof Anthropic.APIConnectionError) return new Error('Интернет байланысы жоқ немесе api.anthropic.com қолжетімсіз.');
  if (e instanceof Anthropic.APIError) return new Error(`API қатесі (${e.status}): ${e.message}`);
  return e;
}

// ---------- 1. АКР құрастыру ----------

const GEN_SYSTEM = `Сен Қазақстан Республикасының бастауыш мектебінде (1–4 сынып) әкімшілік бақылау жұмыстарын (ӘБЖ / АКР) құрастыратын тәжірибелі әдіскерсің.
Жұмыс Оқу-ағарту министрлігінің критериалды бағалау талаптары (№125 бұйрық — үлгерімді ағымдағы бақылау, аралық және қорытынды аттестаттау қағидалары) және мектептің КТЖ шеңберінде жазылады.

Міндетті ережелер:
1. Тек берілген тоқсанда ӨТІЛГЕН тақырыптарды ғана ал. Өтілмеген тақырыпты қоспа.
2. Жұмыс 40 минутқа арналады. Сынып жасына сай, нұсқаулар қысқа, түсінікті.
3. Екі нұсқа жаса: құрылымы, тапсырма саны, балдары бірдей; мазмұны мен ДҰРЫС ЖАУАПТАРЫ әртүрлі (бір нұсқадан көшіруге болмасын).
4. Тапсырма түрлерін араластыр: тест (choice, 3–4 нұсқа), бос орынды толтыру (short), есеп шығару (lines), фигура/кесінді сызу (draw), сәйкестендіру (match), ретін белгілеу (order), мәтінмен жұмыс (passage + сұрақтар). 4–7 тапсырма, жалпы балл 12–20.
5. Ойлау деңгейлері бойынша балл үлесі шамамен: low (білу, түсіну) 25–30%, mid (қолдану) 40–50%, high (талдау, жинақтау, бағалау) 20–30%. Жоғары деңгейлі тапсырма міндетті түрде болсын.
6. Әр дескриптор = 1 балл (points = 1). Тапсырманың points = сол тапсырма дескрипторларының қосындысы. spec ішіндегі points та сонымен бірдей. Барлық сандар бір-біріне сәйкес болсын.
7. descriptors екі нұсқаға ортақ. Әр дескрипторда check өрісіне тексерушіге нақты нұсқау жаз: қай тармақтар (label) дұрыс болса 1 балл беріледі.
8. Әр тапсырманың solution өрісінде толық жауап кілтін жаз (шешу жолымен). Әр item.answer — сол тармақтың қысқа дұрыс жауабы; бірнеше дұрыс нұсқа болса, бәрін көрсет («… немесе …», «мысалы: …»).
9. choice түріндегі item үшін options — жауап нұсқаларының мәтіні (әріпсіз); answer — дұрыс нұсқаның әрпі және мәтіні, мысалы «ә) 42». Басқа түрлерде options бос массив, тек match/order үшін сәйкестендірілетін не ретке қойылатын элементтер.
10. Суреттер: көрнекілік қажет жерде (санау заттары, фигуралар, сызғыш, сағат, кесте, мәтінге сурет) figure_svg өрісіне шағын, ТҮРЛІ ТҮСТІ, өзі жеткілікті SVG жаз: <svg xmlns="http://www.w3.org/2000/svg" viewBox="..."> ... </svg>, 6 КБ-тан аспасын, сыртқы сілтеме, скрипт, сурет файлы, шрифт қоспа. Суреттегі сандар/заттар саны тапсырмамен ДӘЛ сәйкес болсын. Қажет болмаса — бос жол "".
11. draw түріндегі тармақтар оқушының жауап парағында 1 см торлы аймақта орындалады — «1 клетка = 1 см» екенін ескер.
12. LaTeX, markdown белгілерін ($, **, #) қолданба. Математикалық белгілерді кәдімгі мәтінмен жаз: +, −, ×, :, =, <, >.
13. passage — оқуға арналған мәтін (болмаса ""). Мәтін сынып деңгейіне сай, 50–90 сөз.
14. Барлық мәтін жұмыс тілінде (lang) жазылады. Деңгей атаулары, тақырып, мақсат — сол тілде.
15. code өрісіне оқу мақсатының кодын жаз, егер ол тақырыптар тізімінде немесе КТЖ-да берілсе; білмесең — "".
16. title мысалы: «МАТЕМАТИКА. 2-СЫНЫП. ӘКІМШІЛІК БАҚЫЛАУ ЖҰМЫСЫ (1-ТОҚСАН)» / «МАТЕМАТИКА. 2 КЛАСС. АДМИНИСТРАТИВНАЯ КОНТРОЛЬНАЯ РАБОТА (1 ЧЕТВЕРТЬ)».
17. Тапсырма мен кілтте қате болмасын: әр есептің жауабын қайта есептеп тексер, әріптер мен буын саны, тыныс белгілері дұрыс болсын.`;

export async function generateAKR(settings, req) {
  const content = [];
  for (const f of req.attachments || []) {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data }, title: f.name });
  }
  content.push({
    type: 'text',
    text: `Жұмыс параметрлері:
- Сынып: ${req.grade}
- Тоқсан: ${req.quarter}
- Пән: ${req.subjectName}
- Жұмыс тілі (lang): ${req.lang === 'kk' ? 'қазақ тілі' : 'орыс тілі'}
- Ұсынылатын жалпы балл: ${req.points}
${req.attachments?.length ? '- Тіркелген PDF құжаттар (КТЖ, оқулық беттері, үлгі): тақырыптарды солардан ал, үлгінің құрылымын сақта.\n' : ''}
Тоқсанда өтілген тақырыптар:
${req.topics}

${req.notes ? `Қосымша талаптар:\n${req.notes}\n` : ''}
Екі нұсқалы АКР паспортын JSON түрінде жаса.`,
  });
  const { data, usage } = await callJSON(settings.key, settings.model, {
    system: GEN_SYSTEM, content, schema: PASSPORT_SCHEMA, effort: 'high', maxTokens: 64000,
  });
  return { passport: data, usage };
}

// ---------- 2. Жауап парағын тексеру ----------

const GRADE_RULES = `Сен бастауыш сынып оқушыларының әкімшілік бақылау жұмысын тексеретін мұқият тексерушісің.
Саған АКР паспорты (тапсырмалар, жауап кілті, дескрипторлар) және оқушы жауап парағының фотосы беріледі.

Тексеру тәртібі:
1. Парақтан оқушының аты-жөнін, сыныбын және нұсқасын («1-нұсқа», «2-нұсқа», «1 вариант» т.б.) оқы. Нұсқа анық болмаса, жауаптарды кілттермен салыстырып, қайсысы сәйкес келетінін анықта.
2. Әр тапсырманың әр дескрипторы бойынша (descriptors[].items[], index 0-ден басталады) met = true/false шеш. Дескриптордың check нұсқауын қатаң сақта. Жартылай балл жоқ.
3. Дөңгелекшелер: оқушы бояған (толтырған) дөңгелекше — таңдалған жауап. Бір сұрақта екі дөңгелекше боялса немесе түзету анық болмаса — қате деп есепте және comment-ке жаз.
4. Қолжазба: оқушы жазған сөздерді, сандарды, сөйлемдерді мұқият оқы. Кілтте жоқ, бірақ мағынасы дұрыс жауапты қабылда. Емле қатесін дескриптор емлені тексерсе ғана есепке ал.
5. Есептер: шешу жолын, амалдарды және жауапты тексер. Қысқаша жазба/сызба талап етілсе, бар-жоғын қара.
6. Сызба (draw): торлы аймақтағы фигураны/кесіндіні қара: фигура түрі дұрыс па, қабырға/кесінді ұзындығы клетка бойынша талапқа сай ма (±0,5 клетка қабылданады).
7. student_answer — оқушы жазғанның қысқа көшірмесі (оқи алғаныңша). comment — неге дұрыс/қате, бір қысқа сөйлем. Оқу қиын болса confident = false.
8. Фотода көрінбейтін немесе бос қалған тапсырма — met = false, student_answer = "(бос)".
9. Барлық дескриптор үшін нәтиже бер (паспорттағы әрбір task_n және index үшін бір жол).
10. Бағаны, балды өзің есептеме — оны қосымша есептейді. Сен тек дескрипторлар бойынша шешім бер.
11. error_work — осы оқушыға «Қатемен жұмыс» жоспары. summary — 1–2 сөйлем: негізгі қиындығы неде (қатенің себебі: есептеу, ережені білмеу, нұсқауды түсінбеу, асығыстық т.б.). steps — орындалмаған әр дағдыға бір жол (ең көбі 4): skill — қай дағды; repeat — нені қайталау керек (ереже, тәсіл, қысқа); exercise — оқушыға беретін 1 нақты жаттығу, сол сынып деңгейінде, жаңа сандармен/сөздермен, жауабымен бірге жақша ішінде. Оқу қиын болғандықтан (confident = false) қате деп шешілген жерлерге жоспар жазба. Барлығы орындалса — summary-де мадақта, steps-ке 1 күрделірек (дамытушы) тапсырма бер.
Жауап тілі — жұмыс тілінде.`;

export async function gradeSheet(settings, passport, images) {
  const system = [
    { type: 'text', text: GRADE_RULES },
    {
      type: 'text',
      text: `АКР паспорты:\n${JSON.stringify(stripSvg(passport))}`,
      cache_control: { type: 'ephemeral' },
    },
  ];
  const content = images.map((img) => ({
    type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img },
  }));
  content.push({ type: 'text', text: `Бұл бір оқушының жауап парағы (${images.length} фото). Тексер.` });
  const { data, usage } = await callJSON(settings.key, settings.model, {
    system, content, schema: GRADE_SCHEMA, effort: 'high', maxTokens: 32000,
  });
  return { grading: data, usage };
}

// Тексеруге SVG қажет емес — токен үнемдеу үшін алып тастаймыз.
function stripSvg(p) {
  return {
    ...p,
    variants: p.variants.map((v) => ({
      ...v,
      tasks: v.tasks.map((t) => ({
        ...t, figure_svg: t.figure_svg ? '(сурет)' : '',
        items: t.items.map((i) => ({ ...i, figure_svg: i.figure_svg ? '(сурет)' : '' })),
      })),
    })),
  };
}

// ---------- 3. Анықтама-талдау мәтіні ----------

const ANALYSIS_SCHEMA = obj({
  summary: str,
  strengths: arr(str),
  difficulties: arr(str),
  recommendations: arr(str),
  individual: arr(obj({ student: str, difficulty: str, task: str })),
});

export async function writeAnalysis(settings, passport, stats) {
  const { data } = await callJSON(settings.key, settings.model, {
    system: `Сен бастауыш сыныптың оқу ісі меңгерушісінің көмекшісісің. АКР нәтижесі бойынша ресми «Анықтама-талдау» құжатының мәтіндік бөлімдерін жазасың: қысқа, нақты, сандарға сүйеніп. Сандарды өзгертпе, тек берілгенін қолдан. LaTeX, markdown қолданба. Тіл — жұмыс тілі (${passport.lang === 'ru' ? 'орыс' : 'қазақ'}).`,
    content: [{
      type: 'text',
      text: `Жұмыс: ${passport.title}\nТапсырмалар мен дескрипторлар: ${JSON.stringify(passport.descriptors)}\nНәтижелер статистикасы: ${JSON.stringify(stats)}\n\nsummary — 4–6 сөйлемдік қорытынды; strengths — жақсы меңгерілген дағдылар; difficulties — қиындық тудырған дағдылар және жиі қателер; recommendations — 4–6 түзету жұмысы; individual — төмен нәтижелі оқушыларға жеке жоспар (оқушы, қиындығы, қайталайтын тапсырма).`,
    }],
    schema: ANALYSIS_SCHEMA, effort: 'medium', maxTokens: 16000,
  });
  return data;
}
