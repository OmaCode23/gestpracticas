type IconVariant = "blue" | "green" | "amber" | "purple";

const ICON_CLS: Record<IconVariant, string> = {
  blue:   "bg-blue-100 text-blue-600",
  green:  "bg-green-100 text-green-600",
  amber:  "bg-amber-100 text-amber-600",
  purple: "bg-purple-100 text-purple-600",
};

export default function StatCard({ icon, variant = "blue", value, label, trend, trendUp }: {
  icon: string; variant?: IconVariant; value: string | number;
  label: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-border shadow-card flex items-start gap-3.5">
      <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center text-xl shrink-0 ${ICON_CLS[variant]}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-[1.55rem] font-bold text-navy leading-none">{value}</h3>
        <p className="text-[0.78rem] text-text-light mt-0.5">{label}</p>
        {trend && (
          <p className={`text-[0.72rem] font-semibold mt-1 ${trendUp ? "text-green-500" : "text-text-light"}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
