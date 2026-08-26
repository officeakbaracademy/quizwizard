function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function StatsGrid({ totalQuestions, papers, topics, totalMarks }) {
  return (
    <div className="stats" id="stats">
      <StatCard value={totalQuestions} label="Total Questions" />
      <StatCard value={papers} label="Papers Loaded" />
      <StatCard value={topics} label="Topics Available" />
      <StatCard value={totalMarks} label="Total Marks" />
    </div>
  );
}
