import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import { SectionLabel } from "@/components/ui";
import { MOCK_EMPRESAS, MOCK_ALUMNOS, MOCK_FORMACIONES } from "@/shared/mockData";

// TODO: Reemplazar estos contadores por queries reales de Prisma
const stats = {
  empresas:   MOCK_EMPRESAS.length,
  alumnos:    MOCK_ALUMNOS.length,
  formaciones: MOCK_FORMACIONES.length,
};

const MENU_CARDS = [
  { href: "/empresas",     color: "#3b6ef8", bg: "bg-blue-100",   icon: "🏢", title: "Empresas",            desc: "Alta, edición y consulta de empresas colaboradoras. Filtros por sector y localidad.", count: `${stats.empresas} registros` },
  { href: "/alumnos",      color: "#22c55e", bg: "bg-green-100",  icon: "👩‍🎓", title: "Alumnos",             desc: "Registro de alumnos en prácticas. Filtros por ciclo formativo y curso académico.",   count: `${stats.alumnos} alumnos` },
  { href: "/formacion",    color: "#e8a838", bg: "bg-amber-100",  icon: "📋", title: "Formación Empresa",   desc: "Gestión de formaciones en empresa. Consulta y filtrado por curso académico.",         count: `${stats.formaciones} formaciones` },
  { href: "/importexport", color: "#8b5cf6", bg: "bg-purple-100", icon: "🔄", title: "Importar / Exportar", desc: "Carga masiva de datos con plantillas Excel y exportación de registros actuales.",     count: null },
  { href: "#",             color: "#14b8a6", bg: "bg-teal-100",   icon: "📊", title: "Informes",            desc: "Genera informes de asignación, cobertura por sector y seguimiento por ciclo.",      count: null },
  { href: "#",             color: "#ef4444", bg: "bg-red-100",    icon: "⚙️", title: "Configuración",       desc: "Parámetros del sistema, ciclos formativos, cursos académicos y usuarios.",           count: null },
] as const;

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-[0.78rem] text-text-light mb-2">Instituto <span className="text-blue">/ Inicio</span></p>
        <h1 className="font-display text-[1.75rem] text-navy font-bold leading-tight">Panel de Gestión de Prácticas</h1>
        <p className="text-text-mid text-[0.9rem] mt-1.5">Bienvenido. Gestiona empresas, alumnos y formaciones desde aquí.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-[18px] mb-7">
        <StatCard icon="🏢"  variant="blue"   value={stats.empresas}    label="Empresas registradas"  trend="↑ +12 este curso" trendUp />
        <StatCard icon="👩‍🎓" variant="green"  value={stats.alumnos}     label="Alumnos en prácticas"  trend="↑ +28 este curso" trendUp />
        <StatCard icon="📋"  variant="amber"  value={stats.formaciones}  label="Formaciones activas"   trend="Curso 2024–25" />
        <StatCard icon="✅"  variant="purple" value="94%"                label="Tasa de asignación"    trend="↑ +3% vs. año anterior" trendUp />
      </div>

      {/* Menu */}
      <SectionLabel>Accesos rápidos</SectionLabel>
      <div className="grid grid-cols-3 gap-[22px] mt-2">
        {MENU_CARDS.map(card => (
          <Link
            key={card.title} href={card.href}
            className="bg-white rounded-2xl p-8 border-[1.5px] border-border shadow-card relative overflow-hidden block no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg hover:border-transparent"
          >
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: card.color }} />
            {card.count && (
              <span className="absolute top-5 right-5 bg-surface2 text-text-mid text-[0.75rem] font-bold px-2.5 py-0.5 rounded-full">
                {card.count}
              </span>
            )}
            <div className={`w-[52px] h-[52px] rounded-[13px] flex items-center justify-center text-2xl mb-4 ${card.bg}`}>
              {card.icon}
            </div>
            <h3 className="text-[1.05rem] font-bold text-navy mb-1.5">{card.title}</h3>
            <p className="text-[0.82rem] text-text-mid leading-relaxed">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
