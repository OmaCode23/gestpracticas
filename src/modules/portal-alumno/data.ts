export const PORTAL_ALUMNO_LINKS = [
  {
    href: "/portal-alumno",
    label: "Resumen",
  },
  {
    href: "/portal-alumno/ofertas",
    label: "Ofertas",
  },
  {
    href: "/portal-alumno/empresas",
    label: "Empresas",
  },
  {
    href: "/portal-alumno/cursos",
    label: "Cursos",
  },
  {
    href: "/portal-alumno/cv",
    label: "CV",
  },
] as const;

export const CURSOS_EXTERNOS_PREVIEW = [
  {
    id: "cisco-redes",
    proveedor: "Cisco",
    titulo: "Redes y conectividad",
    area: "Redes",
    nivel: "Inicial",
    modalidad: "Online",
  },
  {
    id: "aws-cloud",
    proveedor: "Amazon Web Services",
    titulo: "Fundamentos de cloud",
    area: "Cloud",
    nivel: "Inicial",
    modalidad: "Online",
  },
  {
    id: "microsoft-azure",
    proveedor: "Microsoft",
    titulo: "Servicios cloud y administracion",
    area: "Cloud",
    nivel: "Intermedio",
    modalidad: "Online",
  },
] as const;

export const OFERTA_PRACTICA_FIELDS = [
  "Titulo",
  "Empresa",
  "Ciclo formativo",
  "Plazas",
  "Requisitos",
  "Periodo",
  "Estado",
] as const;
