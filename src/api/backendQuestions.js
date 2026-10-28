import { API_BASE_URL, request } from './client';

/**
 * Reads the backend question bank and reshapes it into the records the rest
 * of the app already understands (see questions.js). Only this file knows
 * the backend's field names, so if they change, this is the one place to fix.
 *
 * Backend: GET /admin/question-papers/questions/search, paginated, one row
 * per question with its parts, mark schemes and page snapshots folded in.
 */

const PAGE_SIZE = 100; // the most the backend allows per page
const BOARD_NAMES = ['Cambridge', 'Edexcel', 'AQA'];

/**
 * Every matching question, page by page until there are no more.
 * filters: { syllabus, paper, topic, difficulty } in the backend's own values;
 * leave one out (or empty) to not filter by it.
 */
async function fetchAllRows(signal, filters = {}) {
  const rows = [];
  let seed;
  for (let page = 1; ; page += 1) {
    const data = await request('/admin/question-papers/questions/search', {
      params: { ...filters, seed, page, page_size: PAGE_SIZE },
      signal,
    });
    rows.push(...data.questions);
    // A target_marks pick is random; sending its seed back keeps page 2 from the same pick.
    seed = data.seed ?? undefined;
    if (!data.has_more) return { rows, data };
  }
}

/**
 * Picture addresses come back as "/api/v1/assets/...". Through the dev proxy
 * that path works as it is; against a full backend address it needs the
 * backend's origin in front.
 */
function assetUrl(url) {
  if (!url || /^https?:/.test(url) || !/^https?:/.test(API_BASE_URL)) return url;
  return new URL(url, API_BASE_URL).href;
}

/** "Edexcel" or "Cambridge IGCSE Physics" -> "Edexcel" / "Cambridge". */
function boardFrom(syllabus) {
  const lower = String(syllabus || '').toLowerCase();
  return BOARD_NAMES.find((board) => lower.includes(board.toLowerCase())) || syllabus || '';
}

function levelFrom(syllabus) {
  const upper = String(syllabus || '').toUpperCase();
  if (upper.includes('A2') || /A[- ]?LEVEL/.test(upper)) return 'A2';
  if (upper.includes('AS')) return 'AS';
  return 'IGCSE';
}

/** "Edexcel" + "Physics" -> "Edexcel Physics"; full names are kept as they are. */
function syllabusLabel(row) {
  const syllabus = row.syllabus || '';
  const subject = row.subject || '';
  return syllabus.toLowerCase().includes(subject.toLowerCase()) ? syllabus : `${syllabus} ${subject}`.trim();
}

/** "hard" -> "Hard", to match the difficulty dropdown. */
function capitalise(value) {
  const text = String(value || '');
  return text ? text[0].toUpperCase() + text.slice(1).toLowerCase() : '';
}

const isMultipleChoice = (row) => ['multiple_choice', 'mcq'].includes(row.question_type);

/** "multiple_choice" -> "MCQ", "structured" -> "Structured". */
function typeLabel(row) {
  return isMultipleChoice(row) ? 'MCQ' : capitalise(String(row.question_type || '').replace(/_/g, ' '));
}

/** The first part's value, for questions where only the parts carry it. */
function fromParts(row, key) {
  return (row.parts || []).map((part) => part[key]).find((value) => value != null && value !== '');
}

function totalMarks(row) {
  if (row.marks != null) return row.marks;
  const partMarks = (row.parts || []).map((part) => part.marks).filter((m) => m != null);
  return partMarks.length ? partMarks.reduce((sum, m) => sum + m, 0) : 0;
}

/**
 * Plain-text mark scheme in the "(a) answer" style the app already formats.
 * Uses the summary when there is one, otherwise builds it from each part.
 */
function markSchemeText(row) {
  if (row.mark_scheme_summary) return row.mark_scheme_summary;
  return (row.parts || [])
    .filter((part) => part.mark_scheme)
    .map((part) => {
      const ms = part.mark_scheme;
      const points = ms.marking_points.length
        ? ms.marking_points.map((p) => p.description)
        : ms.accepted_answers;
      const label = part.part_path || part.part;
      return `${label ? `(${label}) ` : ''}${points.join('; ')}`;
    })
    .join('\n');
}

/** Snapshots of one kind, in page order. */
function snapshotsOf(row, kind) {
  return (row.snapshots || [])
    .filter((s) => s.kind === kind)
    .sort((a, b) => a.page_index - b.page_index)
    .map((s) => assetUrl(s.snapshot_url));
}

/**
 * Snapshot kinds mean different things by question type:
 *   MCQ:     "combined" = question with options A to D, "question" = without
 *            the options, "answer" = the options only. Mark scheme is text.
 *   Written: "question" = question pages, "answer" = mark scheme pages.
 */
function questionPageImages(row) {
  const combined = snapshotsOf(row, 'combined');
  return combined.length ? combined : snapshotsOf(row, 'question');
}

function markSchemePageImages(row) {
  return isMultipleChoice(row) ? [] : snapshotsOf(row, 'answer');
}

function toQuestion(row) {
  const syllabus = syllabusLabel(row);
  return {
    id: row.id,
    board: boardFrom(row.syllabus),
    level: levelFrom(row.syllabus),
    syllabus,
    // The backend's own syllabus name, needed when filtering through the API.
    apiSyllabus: row.syllabus,
    subject: row.subject,
    paper: row.paper,
    paperSetId: row.paper_set_id,
    // Left empty when the API has no topic, so it never shows in the Topic dropdown.
    topic: row.topic || fromParts(row, 'topic') || '',
    questionNumber: row.question_number,
    part: '',
    questionType: typeLabel(row),
    ao: '',
    difficulty: capitalise(row.difficulty || fromParts(row, 'difficulty')),
    marks: totalMarks(row),
    // MCQ options come separately; show them under the question.
    questionText: `${row.question_html || row.question_text || ''}${row.options_html || ''}`,
    markScheme: markSchemeText(row),
  };
}

/** Same result shape as the static snapshot: questions plus two image lookups. */
export async function fetchBackendQuestionBank({ signal } = {}) {
  const { rows } = await fetchAllRows(signal);

  const questions = rows.map(toQuestion);
  const questionImages = {};
  const markSchemeImages = {};
  rows.forEach((row) => {
    const images = questionPageImages(row);
    if (images.length) questionImages[row.id] = images;
    const msImages = markSchemePageImages(row);
    if (msImages.length) markSchemeImages[row.id] = msImages;
  });

  return { questions, questionImages, markSchemeImages };
}

/**
 * The app's filters in the API's own values, kept to the open course:
 * its subject, and its syllabus when the course has only one.
 * questions: the ones loaded for the chosen course.
 */
function apiFilters(filters, questions) {
  const syllabuses = [...new Set(questions.map((q) => q.apiSyllabus))];
  const chosen = questions.find((q) => q.syllabus === filters.syllabus)?.apiSyllabus;
  return {
    subject: questions[0]?.subject,
    syllabus: chosen || (syllabuses.length === 1 ? syllabuses[0] : undefined),
    paper: filters.paper,
    topic: filters.topic,
    difficulty: filters.difficulty.toLowerCase(),
  };
}

/**
 * "Apply filters" through the API: asks the backend which questions match,
 * then returns those from `questions` (the ones already loaded for the chosen
 * course), so ticks and page pictures keep working.
 * filters: the app's own values, e.g. { paper: "Paper 2", difficulty: "Medium" }.
 */
export async function searchBackendQuestions(filters, questions, { signal } = {}) {
  const { rows } = await fetchAllRows(signal, apiFilters(filters, questions));
  const matching = new Set(rows.map((row) => row.id));
  return questions.filter((q) => matching.has(q.id));
}

/**
 * "Generate" by target marks: the API picks a set of the filtered questions
 * whose marks add up to the target. Resolves to the picked ids, in the API's order.
 */
export async function pickBackendQuestionsByMarks(filters, questions, targetMarks) {
  const params = apiFilters(filters, questions);
  // The API takes one exact syllabus; without it the pick could include other boards.
  if (!params.syllabus) {
    throw new Error('Please choose a syllabus in the filters first, then press Apply filters.');
  }
  const { rows, data } = await fetchAllRows(undefined, { ...params, target_marks: targetMarks });
  return {
    ids: rows.map((row) => row.id),
    selectedMarks: data.selected_marks,
    targetReached: data.target_reached,
  };
}

/** "Sort by marks": the filtered questions, highest marks first, as ids. */
export async function sortBackendQuestionsByMarks(filters, questions) {
  const { rows } = await fetchAllRows(undefined, {
    ...apiFilters(filters, questions),
    sort_by: 'marks',
    sort_order: 'desc',
  });
  return rows.map((row) => row.id);
}
