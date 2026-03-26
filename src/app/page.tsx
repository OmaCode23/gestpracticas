import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import graoLogo from "@/app/images/grao-gif.gif";
import StatCard from "@/components/ui/StatCard";
import { SectionLabel } from "@/components/ui";
import { prisma } from "@/database/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();

  const [empresas, alumnos, formaciones] = await Promise.all([
    prisma.empresa.count(),
    prisma.alumno.count(),
    prisma.formacionEmpresa.count(),
  ]);

  const menuCards = [
    {
      href: "/empresas",
      color: "#9f1d3e",
      bg: "bg-[#f5dde4]",
      icon: "🏢",
      title: "Empresas",
      desc: "Alta, edicion y consulta de empresas colaboradoras. Filtros por sector y localidad.",
      count: `${empresas} registros`,
    },
    {
      href: "/alumnos",
      color: "#46634d",
      bg: "bg-[#e7efe7]",
      icon: "🎓",
      title: "Alumnos",
      desc: "Registro de alumnos en practicas. Filtros por ciclo formativo y curso academico.",
      count: `${alumnos} alumnos`,
    },
    {
      href: "/formacion",
      color: "#986333",
      bg: "bg-[#f7ead5]",
      icon: "📋",
      title: "Formacion Empresa",
      desc: "Gestion de formaciones en empresa. Consulta y filtrado por curso academico.",
      count: `${formaciones} formaciones`,
    },
    {
      href: "/importexport",
      color: "#75495a",
      bg: "bg-[#eee4ea]",
      icon: "🔄",
      title: "Importar / Exportar",
      desc: "Carga masiva con plantillas Excel y exportacion de registros actuales.",
      count: null,
    },
    {
      href: "/informes",
      color: "#5a2f3b",
      bg: "bg-[#efe5df]",
      icon: "📊",
      title: "Informes",
      desc: "Genera informes de asignacion, cobertura por sector y seguimiento por ciclo.",
      count: null,
    },
    {
      href: "#",
      color: "#7d4f57",
      bg: "bg-[#f1e4e6]",
      icon: "⚙️",
      title: "Configuracion",
      desc: "Parametros del sistema, ciclos formativos, cursos academicos y usuarios.",
      count: null,
    },
  ] as const;

  return (
    <div>
      <div className="glass-panel relative mb-8 overflow-hidden rounded-[32px] border border-white/70 bg-white/70 px-5 py-6 shadow-card md:px-8 md:py-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#9f1d3e]/10 blur-3xl" />
        <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-[#c9aa83]/20 blur-2xl" />

        <div className="grid items-center gap-8 md:grid-cols-[1.5fr_0.9fr]">
          <div>
            <p className="mb-2 text-[0.78rem] text-text-light">
              Instituto <span className="text-blue">/ Inicio</span>
            </p>
            <h1 className="font-display text-[1.7rem] font-bold leading-tight text-navy md:text-[2rem]">
              Panel de Gestion de Practicas
            </h1>
            <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-text-mid">
              Centraliza la gestion de empresas colaboradoras, alumnado en practicas y
              formaciones en empresa desde un unico panel claro, rapido y preparado para el
              seguimiento diario del centro.
            </p>
          </div>

          <div className="justify-self-start rounded-[28px] border border-[#ead7d7] bg-[#fffdfb] p-5 shadow-[0_18px_40px_rgba(83,42,53,0.12)] md:justify-self-end">
            <Image
              src={graoLogo}
              alt="Logo IES El Grao Valencia"
              className="h-auto w-[220px]"
              priority
            />
          </div>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="🏢" variant="blue" value={empresas} label="Empresas registradas" trend="Datos actuales" />
        <StatCard icon="🎓" variant="green" value={alumnos} label="Alumnos registrados" trend="Datos actuales" />
        <StatCard icon="📋" variant="amber" value={formaciones} label="Formaciones registradas" trend="Datos actuales" />
        <StatCard icon="✅" variant="purple" value={empresas + alumnos + formaciones} label="Registros totales" trend="Suma de modulos" />
      </div>

      <SectionLabel>Accesos rapidos</SectionLabel>
      <div className="mt-2 grid grid-cols-1 gap-[22px] md:grid-cols-2 xl:grid-cols-3">
        {menuCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="glass-panel relative block overflow-hidden rounded-[26px] border border-white/70 bg-white/84 p-8 no-underline shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-[#ead7d7] hover:shadow-card-lg"
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: `linear-gradient(90deg, ${card.color}, rgba(255,255,255,0.35))` }}
            />
            {card.count && (
              <span className="absolute right-5 top-5 rounded-full bg-surface2 px-2.5 py-0.5 text-[0.75rem] font-bold text-text-mid">
                {card.count}
              </span>
            )}
            <div className={`mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] text-2xl ${card.bg}`}>
              {card.icon}
            </div>
            <h3 className="mb-1.5 text-[1.05rem] font-bold text-navy">{card.title}</h3>
            <p className="text-[0.82rem] leading-relaxed text-text-mid">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
