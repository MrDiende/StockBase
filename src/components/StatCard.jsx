// A simple dashboard statistic card: a label, a big value, and an
// optional colored trend line beneath it.
export function StatCard({ label, value, trend }) {
  return (
    <div className="card stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {trend && (
        <p className={`stat-trend ${trend.positive ? "stat-trend-up" : "stat-trend-down"}`}>
          {trend.value}
        </p>
      )}
    </div>
  );
}
