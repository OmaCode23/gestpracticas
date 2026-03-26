type IconVariant = "blue" | "green" | "amber" | "purple";

const ICON_CLS: Record<IconVariant, string> = {
  blue: "bg-[#f5dde4] text-[#9f1d3e]",
  green: "bg-[#e7efe7] text-[#46634d]",
  amber: "bg-[#f7ead5] text-[#986333]",
  purple: "bg-[#eee4ea] text-[#75495a]",
};

export default function StatCard({
  icon,
  variant = "blue",
  value,
  label,
  trend,
  trendUp,
}: {
  icon: string;
  variant?: IconVariant;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="glass-panel flex items-start gap-3.5 rounded-[24px] border border-white/70 bg-white/82 p-5 shadow-card">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-xl ${ICON_CLS[variant]}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-[1.55rem] font-bold leading-none text-navy">{value}</h3>
        <p className="mt-0.5 text-[0.78rem] text-text-light">{label}</p>
        {trend && (
          <p className={`mt-1 text-[0.72rem] font-semibold ${trendUp ? "text-green-600" : "text-text-light"}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
