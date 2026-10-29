/**
 * The Akbar Academy catalogue as the academy teaches it, independent of what
 * the question bank currently holds.
 *
 * Every subject, level and exam board Akbar Academy offers is listed here so
 * the tool reads as the full multi-subject, multi-board system. Availability is
 * worked out at runtime from the loaded questions (see buildCatalogue), and
 * anything with no questions yet is shown as "in build" rather than hidden.
 */

export const SUBJECTS = [
  { id: 'physics', name: 'Physics', icon: '/brand/subjects/physics.png', accent: '#02bafd' },
  { id: 'chemistry', name: 'Chemistry', icon: '/brand/subjects/chemistry.png', accent: '#6fcf3a' },
  { id: 'biology', name: 'Biology', icon: '/brand/subjects/biology.png', accent: '#17b978' },
  { id: 'maths', name: 'Maths', icon: '/brand/subjects/maths.png', accent: '#f9b602' },
  { id: 'english', name: 'English', icon: '/brand/subjects/english.png', accent: '#c56cf0' },
];

export const LEVELS = [
  { id: 'IGCSE', name: 'IGCSE', note: 'Year 10 and 11' },
  { id: 'AS', name: 'AS Level', note: 'Year 12' },
  { id: 'A2', name: 'A2 Level', note: 'Year 13' },
];

export const BOARDS = [
  {
    id: 'Cambridge',
    name: 'Cambridge',
    full: 'Cambridge International',
  },
  {
    id: 'Edexcel',
    name: 'Edexcel',
    full: 'Pearson Edexcel International',
  },
  { id: 'AQA', name: 'AQA', full: 'AQA and Oxford AQA' },
];

export const getSubject = (id) => SUBJECTS.find((s) => s.id === id) || null;
export const getBoard = (id) => BOARDS.find((b) => b.id === id) || null;
export const getLevel = (id) => LEVELS.find((l) => l.id === id) || null;

/**
 * The bank has no subject column yet - every record carries a syllabus string
 * such as "Cambridge IGCSE Physics". Read the subject out of it, defaulting to
 * Physics, which is what the current bank holds.
 */
export function subjectOf(question) {
  // The backend says each question's subject ("Physics"); use it as it is.
  const value = String(question.subject || '').toLowerCase();
  const named = SUBJECTS.find((subject) => subject.id === value || subject.name.toLowerCase() === value);
  if (named) return named.id;
  return value.startsWith('math') ? 'maths' : value;
}

/** Normalises the level string on a record to one of the catalogue levels. */
export function levelOf(question) {
  const value = String(question.level || '').toUpperCase();
  if (value.includes('A2') || value.includes('A LEVEL')) return 'A2';
  if (value.includes('AS')) return 'AS';
  return 'IGCSE';
}

export function boardOf(question) {
  const value = String(question.board || '');
  const match = BOARDS.find((board) => value.toLowerCase().includes(board.id.toLowerCase()));
  return match ? match.id : value || 'Cambridge';
}
