import { Alert, Badge, Card, CardHeader, CardTitle, PageHeader, SectionLabel } from "@/components/ui";

const REPORT_CARDS = [
  {
    title: "Informes de Alumnos",
    icon: "\u{1F393}",
    iconVariant: "blue" as const,
    badge: "Pendiente",
    badgeVariant: "blue" as const,
    description:
      "Prepara el espacio para listados por ciclo, curso academico y estado de practicas.",
    highlights: [
      "Listado general de alumnos",
      "Filtro por ciclo formativo",
      "Filtro por curso academico",
    ],
  },
  {
    title: "Informes de Empresas",
    icon: "\u{1F3E2}",
    iconVariant: "green" as const,
    badge: "Pendiente",
    badgeVariant: "green" as const,
    description:
      "Deja lista la base para informes por sector, localidad y empresas colaboradoras.",
    highlights: [
      "Directorio completo de empresas",
      "Filtro por sector",
      "Filtro por localidad",
    ],
  },
  {
    title: "Informes de Formacion Empresa",
    icon: "\u{1F4CB}",
    iconVariant: "amber" as const,
    badge: "Pendiente",
    badgeVariant: "amber" as const,
    description:
      "Reserva la vista para el seguimiento de formaciones en empresa por curso y asignacion.",
    highlights: [
      "Listado de formaciones",
      "Filtro por curso academico",
      "Seguimiento por empresa y alumno",
    ],
  },
];

export default function InformesPanel() {
  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Informes"
        title="Informes"
        subtitle="Centraliza la generacion de informes de alumnos, empresas y formacion en empresa."
      />

      <Alert variant="info">
        Esta primera version deja la pagina preparada. En el siguiente paso conectamos
        cada bloque con sus filtros y la generacion de informes.
      </Alert>

      <SectionLabel>Areas Disponibles</SectionLabel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => (
          <Card key={card.title} className="h-full">
            <CardHeader>
              <CardTitle icon={card.icon} iconVariant={card.iconVariant}>
                {card.title}
              </CardTitle>
              <Badge variant={card.badgeVariant}>{card.badge}</Badge>
            </CardHeader>

            <div className="px-6 py-5">
              <p className="text-[0.88rem] leading-relaxed text-text-mid">
                {card.description}
              </p>

              <div className="mt-4 space-y-2">
                {card.highlights.map((highlight) => (
                  <p key={highlight} className="text-[0.82rem] text-navy">
                    {highlight}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
