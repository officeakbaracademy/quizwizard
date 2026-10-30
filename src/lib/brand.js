/**
 * The subjects Akbar Academy teaches, with their mascot and colour, so the
 * picker always shows all of them. Which ones are open, and the boards and
 * levels, come from the catalog API (see buildCatalogue); a subject with no
 * questions yet shows as "in build".
 */

export const SUBJECTS = [
  { id: 'physics', name: 'Physics', icon: '/brand/subjects/physics.png', accent: '#02bafd' },
  { id: 'chemistry', name: 'Chemistry', icon: '/brand/subjects/chemistry.png', accent: '#6fcf3a' },
  { id: 'biology', name: 'Biology', icon: '/brand/subjects/biology.png', accent: '#17b978' },
  { id: 'maths', name: 'Maths', icon: '/brand/subjects/maths.png', accent: '#f9b602' },
  { id: 'english', name: 'English', icon: '/brand/subjects/english.png', accent: '#c56cf0' },
];

export const getSubject = (id) => SUBJECTS.find((s) => s.id === id) || null;

/** The app's subject id ("physics") for the subject the API names ("Physics"). */
export function subjectOf(question) {
  const value = String(question.subject || '').toLowerCase();
  const named = SUBJECTS.find((subject) => subject.id === value || subject.name.toLowerCase() === value);
  if (named) return named.id;
  return value.startsWith('math') ? 'maths' : value;
}
