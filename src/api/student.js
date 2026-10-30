/**
 * The logged-in student's own courses, from the school's "student subjects"
 * API. The dev server forwards /student-api to it and adds the API key (see
 * vite.config.js), so the browser never sees the key.
 *
 * Who the student is comes from the link (?type=student&auth_token=...). While
 * testing, .env.local supplies them instead (VITE_TEST_USER_TYPE and
 * VITE_TEST_AUTH_TOKEN).
 */

export function getStudentLogin() {
  const params = new URLSearchParams(window.location.search);
  return {
    type: params.get('type') || import.meta.env.VITE_TEST_USER_TYPE || '',
    authToken: params.get('auth_token') || import.meta.env.VITE_TEST_AUTH_TOKEN || '',
  };
}

/*
 * The school names boards and levels differently from the question bank, so
 * they are translated here:
 *   "Cambridge - IGCSE"            -> Cambridge, IGCSE
 *   "Edexcel - International GCSE" -> Edexcel, IGCSE
 *   "Cambridge International" with the level "AS Level" -> Cambridge, AS
 * Its "Full Syllabus" and "Half Syllabus" are not levels in the question bank;
 * the level for those comes from the board name ("... IGCSE").
 */
function toBoard(text) {
  const value = text.toLowerCase();
  if (value.includes('cambridge')) return 'Cambridge';
  if (value.includes('edexcel')) return 'Edexcel';
  // "Oxford International GCSE" and "Oxford International AQA" are both AQA.
  if (value.includes('aqa') || value.includes('oxford')) return 'AQA';
  return null;
}

function toLevel(boardText, levelText) {
  const board = boardText.toLowerCase();
  const level = levelText.toLowerCase();
  if (board.includes('igcse') || board.includes('international gcse')) return 'IGCSE';
  if (/\bgcse\b/.test(board)) return 'GCSE';
  if (/\bas\b/.test(level)) return 'AS';
  if (/\ba2\b|\ba level\b/.test(level)) return 'A2';
  return null;
}

/**
 * Resolves to the student's courses in the question bank's names, e.g.
 * [{ subject: "Physics", board: "Cambridge", level: "IGCSE" }], or to null when
 * there is no student (no auth token), in which case nothing is filtered.
 */
export async function fetchStudentCourses({ signal } = {}) {
  const { type, authToken } = getStudentLogin();
  if (!authToken) return null;

  const params = new URLSearchParams({ type, auth_token: authToken });
  const response = await fetch(`/student-api/v1/exam_wizard/getSubjects.php?${params}`, { signal });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // The school server answers some errors in plain text ("Invalid or expired token").
    throw new Error(text.trim() || `HTTP ${response.status}`);
  }
  if (!response.ok || data.success === false) throw new Error(data.error || `HTTP ${response.status}`);

  // Subjects and levels come as two lists, so every subject gets every level and board.
  const courses = [];
  for (const subject of data.subjects || []) {
    for (const entry of data.levels || []) {
      for (const boardText of entry.boards || []) {
        const board = toBoard(boardText);
        const level = toLevel(boardText, entry.level || '');
        const known = courses.some(
          (c) => c.subject === subject.title && c.board === board && c.level === level,
        );
        if (board && level && !known) courses.push({ subject: subject.title, board, level });
      }
    }
  }
  return courses;
}
