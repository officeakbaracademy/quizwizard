import { API_BASE_URL, request } from './client';

/**
 * Reads the backend question bank and reshapes it into the records the rest
 * of the app already understands (see questions.js). Only this file knows
 * the backend's field names, so if they change, this is the one place to fix.
 *
 * Backend: GET /question-bank/questions/search (the student search, which
 * works with the normal token, not the admin one), paginated, one row per
 * question with its board, level, subject, parts and page snapshots.
 */

const PAGE_SIZE = 100; // the most the backend allows per page

/**
 * Every matching question, page by page until there are no more.
 * filters: { board, level, subject, paper, topic, difficulty } in the backend's own values;
 * leave one out (or empty) to not filter by it.
 */
async function fetchAllRows(signal, filters = {}) {
  const rows = [];
  let seed;
  for (let page = 1; ; page += 1) {
    const data = await request('/question-bank/questions/search', {
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
 * Snapshot kinds: "question" (the question), "options" (MCQ options A to D),
 * "combined" (an MCQ with its options) and "mark_scheme" (mark scheme pages).
 * MCQs show the combined picture so the options are included.
 */
function questionPageImages(row) {
  const combined = snapshotsOf(row, 'combined');
  return combined.length ? combined : snapshotsOf(row, 'question');
}

function markSchemePageImages(row) {
  return snapshotsOf(row, 'mark_scheme');
}

function toQuestion(row) {
  return {
    id: row.id,
    board: row.board,
    level: row.level,
    // A readable course name, e.g. "Cambridge IGCSE Physics".
    syllabus: [row.board, row.level, row.subject].filter(Boolean).join(' '),
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

/**
 * What Quiz Wizard offers, from GET /question-bank/catalog: the active boards,
 * levels and courses, each course with its paper labels and topics. One tiny
 * search per course (page_size 1) adds its question count, for the
 * "N questions" tags on the course picker.
 */
export async function fetchCatalog({ signal } = {}) {
  const catalog = await request('/question-bank/catalog', { signal });
  const courses = (catalog.subjects || []).filter((course) => course.active !== false);
  const totals = await Promise.all(
    courses.map((course) =>
      request('/question-bank/questions/search', {
        params: { board: course.board, level: course.level, subject: course.name, page: 1, page_size: 1 },
        signal,
      }).then((data) => data.total ?? 0),
    ),
  );
  return {
    boards: (catalog.boards || []).filter((board) => board.active !== false),
    levels: (catalog.levels || []).filter((level) => level.active !== false),
    courses: courses.map((course, i) => ({ ...course, total: totals[i] })),
  };
}

/**
 * One course's questions plus two image lookups.
 * course: the API's own names, e.g. { board: "Cambridge", level: "IGCSE", subject: "Physics" }.
 */
export async function fetchBackendQuestionBank({ signal, course } = {}) {
  const { rows } = await fetchAllRows(signal, course);

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
 * The app's filters in the API's own values, kept to the open course
 * (its board, level and subject).
 * questions: the ones loaded for the chosen course.
 */
function apiFilters(filters, questions) {
  const course = questions[0] || {};
  return {
    board: course.board,
    level: course.level,
    subject: course.subject,
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
