import { getBoard } from '../lib/brand';

/**
 * Exam board logos sit on a white chip in both themes. Edexcel is navy and AQA
 * is purple on transparent, so neither survives a black background on its own,
 * and the chip keeps all three official and legible.
 */
export default function BoardLogo({ board, small = false }) {
  const entry = typeof board === 'string' ? getBoard(board) : board;
  if (!entry) return null;

  return (
    <span className={small ? 'board-chip board-chip-sm' : 'board-chip'}>
      <img src={entry.logo} alt={`${entry.full} logo`} loading="lazy" />
    </span>
  );
}
