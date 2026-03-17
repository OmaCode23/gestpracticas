/**
 * shared/mockData.ts
 * Datos de ejemplo para todas las páginas.
 * Cuando conectéis la BD, reemplazad estas constantes
 * por llamadas a vuestra API / Prisma.
 */

export const MOCK_EMPRESAS = [
  { id: 1, nombre: "Tecnologías Mediterráneo S.L.", cif: "B12345678", localidad: "Valencia",  sector: "Informática / TIC",    ciclo: "DAM",  contacto: "Ana García López",   telefono: "963 100 200", email: "contacto@tecmed.es" },
  { id: 2, nombre: "Clínica Salud Levante",         cif: "B87654321", localidad: "Torrent",   sector: "Sanidad",               ciclo: "CAE",  contacto: "Carlos Ruiz Pons",   telefono: "961 200 300", email: "info@saludlevante.es" },
  { id: 3, nombre: "Hotel Neptuno Valencia",        cif: "A11223344", localidad: "Valencia",  sector: "Hostelería / Turismo",  ciclo: "TH",   contacto: "María Torres Vidal", telefono: "963 300 400", email: "rrhh@neptuno.es" },
  { id: 4, nombre: "Electricidad Martínez e Hijos", cif: "B55667788", localidad: "Gandía",    sector: "Electricidad",          ciclo: "IEA",  contacto: "José Martínez Gil",  telefono: "962 400 500", email: "info@emh.es" },
  { id: 5, nombre: "Gestión Administrativa Alc.",   cif: "B99001122", localidad: "Alicante",  sector: "Administración",        ciclo: "ADG",  contacto: "Laura Pérez Mas",    telefono: "965 500 600", email: "admin@gestalc.es" },
  { id: 6, nombre: "Devapps Solutions S.L.",        cif: "B22334455", localidad: "Valencia",  sector: "Informática / TIC",    ciclo: "DAW",  contacto: "Rosa Molina Camps",  telefono: "963 600 700", email: "rrhh@devapps.es" },
];

export const MOCK_ALUMNOS = [
  { id: 1, nombre: "Laura Sánchez Moreno",   nia: "240001", ciclo: "DAM",  curso: "2024–2025", telefono: "612 111 222", email: "l.sanchez@educa.gva.es" },
  { id: 2, nombre: "Miguel Fernández López", nia: "240002", ciclo: "ASIR", curso: "2024–2025", telefono: "623 222 333", email: "m.fernandez@educa.gva.es" },
  { id: 3, nombre: "Patricia Gómez Ruiz",    nia: "240003", ciclo: "DAW",  curso: "2024–2025", telefono: "634 333 444", email: "p.gomez@educa.gva.es" },
  { id: 4, nombre: "Andrés Torres Beltrán",  nia: "240004", ciclo: "SMR",  curso: "2024–2025", telefono: "645 444 555", email: "a.torres@educa.gva.es" },
  { id: 5, nombre: "Cristina Navarro Pons",  nia: "230085", ciclo: "ADG",  curso: "2023–2024", telefono: "656 555 666", email: "c.navarro@educa.gva.es" },
];

export const MOCK_FORMACIONES = [
  { id: 1, empresa: "Devapps Solutions S.L.",   alumno: "Laura Sánchez Moreno",   periodo: "Mar–Jun 2025", descripcion: "Desarrollo de aplicaciones web",    contacto: "Rosa Molina Camps", curso: "2024–2025" },
  { id: 2, empresa: "CloudBase Informática",    alumno: "Miguel Fernández López", periodo: "Mar–Jun 2025", descripcion: "Administración de sistemas Linux",  contacto: "Tomás Vidal Soler", curso: "2024–2025" },
  { id: 3, empresa: "Redes y Sistemas Alicante",alumno: "Patricia Gómez Ruiz",    periodo: "Mar–Jun 2025", descripcion: "Soporte técnico y redes",           contacto: "Pilar Serna Ibáñez",curso: "2024–2025" },
  { id: 4, empresa: "Integra TI Valenciana",    alumno: "Andrés Torres Beltrán",  periodo: "Mar–Jun 2025", descripcion: "Mantenimiento de equipos",          contacto: "Marcos López Puig", curso: "2024–2025" },
];

export const MOCK_IMPORT_LOG = [
  { fecha: "12/03/2025 09:42", tipo: "Alumnos",       accion: "Importación", registros: "47 registros",  estado: "Completado", usuario: "Administrador" },
  { fecha: "10/03/2025 16:15", tipo: "Empresas",      accion: "Exportación", registros: "148 registros", estado: "Completado", usuario: "Administrador" },
  { fecha: "05/03/2025 11:30", tipo: "Form. Empresa", accion: "Importación", registros: "23 registros",  estado: "Completado", usuario: "Administrador" },
];

export const CICLOS = ["DAM", "DAW", "ASIR", "SMR", "ADG", "CAE", "IEA", "TH"];
export const CURSOS = ["2024–2025", "2023–2024", "2022–2023"];
export const SECTORES = ["Informática / TIC", "Administración", "Sanidad", "Electricidad", "Hostelería / Turismo", "Comercio", "Industria", "Otro"];
export const LOCALIDADES = ["Valencia", "Alicante", "Castellón", "Torrent", "Gandía", "Sagunto"];
