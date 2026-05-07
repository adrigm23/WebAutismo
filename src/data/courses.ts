export type CourseModule = {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  resourcesSummary: string;
};

export type CourseFaq = {
  question: string;
  answer: string;
};

export type CourseTeacher = {
  name: string;
  role: string;
  bio: string;
};

export type Course = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  priceInCents: number;
  duration: string;
  format: string;
  level: string;
  accentFrom: string;
  accentTo: string;
  category: string;
  audience: string[];
  outcomes: string[];
  modules: CourseModule[];
  methodology: string[];
  faq: CourseFaq[];
  teacher: CourseTeacher;
  seoTitle: string;
  seoDescription: string;
};

function defineCourse(course: Course) {
  return course;
}

export const courses: Course[] = [
  defineCourse({
    slug: "nociones-basicas-sobre-apoyo-conductual-positivo-para-profesionales",
    title: "Nociones basicas sobre apoyo conductual positivo para profesionales",
    shortDescription:
      "Una introduccion practica al apoyo conductual positivo aplicada a contextos educativos, sociales y clinicos.",
    description:
      "Un curso pensado para profesionales que trabajan con personas con autismo y necesitan comprender la conducta desde un enfoque preventivo, funcional y respetuoso.",
    priceInCents: 8000,
    duration: "3 horas de contenido",
    format: "Video bajo demanda y materiales",
    level: "Iniciacion",
    accentFrom: "#0b6357",
    accentTo: "#f08968",
    category: "Conducta",
    audience: [
      "Profesionales de intervencion",
      "Equipos educativos",
      "Centros terapeuticos"
    ],
    outcomes: [
      "Comprender los principios del apoyo conductual positivo.",
      "Detectar desencadenantes y funciones de la conducta.",
      "Disenar estrategias preventivas aplicables al dia a dia.",
      "Hablar el mismo idioma tecnico dentro del equipo."
    ],
    modules: [
      {
        id: "marco-conceptual",
        title: "Marco conceptual",
        description: "Que es el apoyo conductual positivo y por que cambia la intervencion.",
        estimatedTime: "40 minutos",
        resourcesSummary: "Guia base y esquema conceptual"
      },
      {
        id: "evaluacion-funcional",
        title: "Evaluacion funcional",
        description: "Como observar, registrar y entender el por que de la conducta.",
        estimatedTime: "50 minutos",
        resourcesSummary: "Plantilla de observacion"
      },
      {
        id: "prevencion-y-apoyos",
        title: "Prevencion y apoyos",
        description: "Adaptaciones, anticipacion, entorno y ensenanza de habilidades.",
        estimatedTime: "45 minutos",
        resourcesSummary: "Checklist de apoyos preventivos"
      },
      {
        id: "aplicacion-real",
        title: "Aplicacion real",
        description: "Casos de uso y decisiones practicas para contextos reales.",
        estimatedTime: "45 minutos",
        resourcesSummary: "Caso guiado de aplicacion"
      }
    ],
    methodology: [
      "Lecciones en video por bloques cortos.",
      "Resumen descargable para el equipo.",
      "Acceso gestionado desde el area privada segun la edicion activa."
    ],
    faq: [
      {
        question: "Cuanto tiempo tendre acceso al curso?",
        answer:
          "El acceso depende de la edicion asociada a tu matricula y de la ventana de consulta configurada por el campus."
      },
      {
        question: "Puedo descargar los videos?",
        answer: "No. Los videos se visualizan en streaming desde la plataforma para proteger el contenido."
      },
      {
        question: "Recibire un correo al comprar?",
        answer: "Si. Recibiras un correo de confirmacion con acceso directo y siguientes pasos."
      }
    ],
    teacher: {
      name: "Equipo de Formacion de Autismo Cordoba",
      role: "Especialistas en intervencion y apoyo conductual",
      bio: "Profesionales con experiencia en formacion aplicada a familias, entidades y equipos tecnicos."
    },
    seoTitle:
      "Curso de apoyo conductual positivo para profesionales | Campus Autismo Cordoba",
    seoDescription:
      "Curso online de apoyo conductual positivo para profesionales con compra directa, acceso por edicion y contenido especializado en autismo."
  }),
  defineCourse({
    slug: "comunicacion-funcional-en-autismo",
    title: "Comunicacion funcional en autismo",
    shortDescription:
      "Claves para favorecer una comunicacion util, comprensible y funcional en diferentes contextos.",
    description:
      "Formacion orientada a profesionales y familias que necesitan mejorar la intencion comunicativa y la comprension del entorno.",
    priceInCents: 6900,
    duration: "2 horas y 20 minutos",
    format: "Video bajo demanda y guia practica",
    level: "Todos los niveles",
    accentFrom: "#134e4a",
    accentTo: "#dba24b",
    category: "Comunicacion",
    audience: ["Familias", "Logopedas", "Profesionales de apoyo"],
    outcomes: [
      "Detectar barreras comunicativas frecuentes.",
      "Crear oportunidades de comunicacion natural.",
      "Ajustar apoyos visuales y lenguaje al perfil de la persona."
    ],
    modules: [
      {
        id: "bases-de-comunicacion-funcional",
        title: "Bases de comunicacion funcional",
        description: "Intencion comunicativa, contexto y significado.",
        estimatedTime: "40 minutos",
        resourcesSummary: "Mapa de funciones comunicativas"
      },
      {
        id: "apoyos-visuales",
        title: "Apoyos visuales",
        description: "Como disenar apoyos utiles y sostenibles.",
        estimatedTime: "45 minutos",
        resourcesSummary: "Guia de apoyos visuales"
      },
      {
        id: "generalizacion",
        title: "Generalizacion",
        description: "Como trasladar aprendizajes a casa, aula y comunidad.",
        estimatedTime: "35 minutos",
        resourcesSummary: "Ejemplos de aplicacion por contexto"
      }
    ],
    methodology: [
      "Videos practicos centrados en situaciones reales.",
      "Ejemplos aplicados para familia y profesion.",
      "Acceso desde tu cuenta segun matricula y edicion."
    ],
    faq: [
      {
        question: "Incluye materiales?",
        answer: "Si, incluye una guia practica de apoyo."
      }
    ],
    teacher: {
      name: "Area de Lenguaje y Comunicacion",
      role: "Formacion especializada",
      bio: "Equipo centrado en comunicacion, accesibilidad cognitiva y apoyos visuales."
    },
    seoTitle: "Curso online de comunicacion funcional en autismo",
    seoDescription:
      "Compra el curso de comunicacion funcional en autismo y accede al contenido siempre desde tu cuenta."
  }),
  defineCourse({
    slug: "adaptaciones-en-el-aula-para-estudiantes-con-autismo",
    title: "Adaptaciones en el aula para estudiantes con autismo",
    shortDescription:
      "Recursos concretos para mejorar participacion, comprension y bienestar dentro del aula.",
    description:
      "Curso practico para docentes y equipos de orientacion que quieran aplicar ajustes razonables con criterio.",
    priceInCents: 7500,
    duration: "2 horas y 45 minutos",
    format: "Video y checklist docente",
    level: "Intermedio",
    accentFrom: "#1f4669",
    accentTo: "#e67b5d",
    category: "Educacion",
    audience: ["Docentes", "Orientacion", "Centros educativos"],
    outcomes: [
      "Detectar barreras del entorno escolar.",
      "Aplicar apoyos visuales, estructuracion y adaptacion sensorial.",
      "Coordinar medidas de aula con el equipo educativo."
    ],
    modules: [
      {
        id: "entorno-y-accesibilidad",
        title: "Entorno y accesibilidad",
        description: "Organizacion fisica, ruido, tiempos y apoyos.",
        estimatedTime: "55 minutos",
        resourcesSummary: "Checklist de entorno"
      },
      {
        id: "participacion-en-el-aula",
        title: "Participacion en el aula",
        description: "Como facilitar comprension, turnos y tareas.",
        estimatedTime: "50 minutos",
        resourcesSummary: "Secuencias y apoyos de aula"
      },
      {
        id: "coordinacion",
        title: "Coordinacion",
        description: "Trabajo conjunto con familia y especialistas.",
        estimatedTime: "40 minutos",
        resourcesSummary: "Guion de coordinacion"
      }
    ],
    methodology: [
      "Explicaciones orientadas a practica docente.",
      "Checklist final de aplicacion.",
      "Acceso gestionado desde el area privada segun la edicion."
    ],
    faq: [
      {
        question: "Sirve para infantil y primaria?",
        answer: "Si, los principios son transferibles y los ejemplos cubren varias etapas."
      }
    ],
    teacher: {
      name: "Equipo de inclusion educativa",
      role: "Docencia y apoyo escolar",
      bio: "Especialistas en accesibilidad, inclusion y apoyos en contextos educativos."
    },
    seoTitle: "Curso de adaptaciones en el aula para autismo",
    seoDescription:
      "Formacion online para docentes sobre adaptaciones en el aula para estudiantes con autismo."
  })
];

const courseBySlug = new Map(courses.map((course) => [course.slug, course] as const));

export const featuredCourses = courses.slice(0, 3);

export function getCourseBySlug(slug: string) {
  return courseBySlug.get(slug);
}
