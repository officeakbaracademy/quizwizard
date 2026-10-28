const ACCENTS = ['var(--electric)', 'var(--mandarin)', 'var(--pass)', 'var(--electric)'];

function StatCard({ value, label, accent }) {
  return (
    <div className="stat-card" style={{ '--stat-accent': accent }}>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function StatsGrid({ totalQuestions, papers, topics, totalMarks }) {
  const cards = [
    { value: totalQuestions, label: 'Questions' },
    { value: papers, label: 'Papers loaded' },
    { value: topics, label: 'Topics covered' },
    { value: totalMarks, label: 'Marks available' },
  ];

  return (
    <div className="stats">
      {cards.map((card, index) => (
        <StatCard key={card.label} {...card} accent={ACCENTS[index]} />
      ))}
    </div>
  );
}
