import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  BookOpenCheck,
  CircleHelp,
  Files,
  LayoutList,
  MessageSquareMore
} from "lucide-react";

export type ForumCategoryPreset = {
  icon: LucideIcon;
  eyebrow: string;
  expectedContent: string;
  guidance: string;
  highlights: string[];
  heroClass: string;
  iconClass: string;
  accentClass: string;
  softClass: string;
};

const defaultPreset: ForumCategoryPreset = {
  icon: MessageSquareMore,
  eyebrow: "Comunidad del curso",
  expectedContent: "Conversaciones y seguimiento del curso",
  guidance: "Espacio general de trabajo compartido para el grupo.",
  highlights: [
    "Comparte dudas concretas y contexto suficiente para que el equipo pueda ayudarte.",
    "Mantén el hilo centrado en el objetivo del curso y en el aprendizaje del grupo.",
    "Usa títulos claros para que el histórico del foro sea fácil de revisar."
  ],
  heroClass:
    "border-[rgba(12,113,195,0.16)] bg-[linear-gradient(135deg,rgba(12,113,195,0.12),rgba(255,255,255,0.98)_58%,rgba(46,163,242,0.08))]",
  iconClass: "bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)]",
  accentClass:
    "bg-[linear-gradient(90deg,rgba(12,113,195,0.98),rgba(46,163,242,0.65),rgba(255,182,6,0.35))]",
  softClass: "bg-[rgba(12,113,195,0.08)]"
};

const categoryPresets: Record<string, ForumCategoryPreset> = {
  anuncios: {
    icon: BellRing,
    eyebrow: "Canal docente",
    expectedContent: "Avisos, recordatorios y cambios importantes",
    guidance: "Espacio prioritario para anuncios del profesorado y comunicaciones clave.",
    highlights: [
      "Ideal para fechas, cambios de calendario y avisos institucionales.",
      "Los anuncios pueden fijarse o publicarse en modo solo lectura.",
      "Conviene mantener este espacio limpio y fácil de escanear."
    ],
    heroClass:
      "border-[rgba(12,113,195,0.2)] bg-[linear-gradient(135deg,rgba(12,113,195,0.16),rgba(255,255,255,0.99)_55%,rgba(46,163,242,0.09))]",
    iconClass: "bg-[rgba(12,113,195,0.12)] text-[var(--color-primary)]",
    accentClass:
      "bg-[linear-gradient(90deg,rgba(12,113,195,1),rgba(46,163,242,0.72),rgba(255,182,6,0.38))]",
    softClass: "bg-[rgba(12,113,195,0.08)]"
  },
  dudas: {
    icon: CircleHelp,
    eyebrow: "Soporte del curso",
    expectedContent: "Preguntas, aclaraciones y resolución compartida",
    guidance: "Plantea aquí dudas concretas sobre contenidos, metodología o seguimiento.",
    highlights: [
      "Cuanto más específico sea el título, más fácil será localizar la respuesta después.",
      "Marca respuestas resueltas para evitar repetir dudas ya contestadas.",
      "Añade contexto, unidad o actividad para acelerar la ayuda del profesorado."
    ],
    heroClass:
      "border-[rgba(255,182,6,0.28)] bg-[linear-gradient(135deg,rgba(255,182,6,0.18),rgba(255,255,255,0.99)_56%,rgba(12,113,195,0.07))]",
    iconClass: "bg-[rgba(255,182,6,0.2)] text-[#8c5b00]",
    accentClass:
      "bg-[linear-gradient(90deg,rgba(255,182,6,0.92),rgba(255,201,74,0.88),rgba(12,113,195,0.32))]",
    softClass: "bg-[rgba(255,182,6,0.12)]"
  },
  tareas: {
    icon: BookOpenCheck,
    eyebrow: "Seguimiento práctico",
    expectedContent: "Ejercicios, entregas y aclaraciones sobre actividades",
    guidance:
      "Organiza aquí el trabajo aplicado del curso, especialmente ejercicios y tareas adicionales.",
    highlights: [
      "Agrupa preguntas por actividad o módulo para no mezclar entregables.",
      "Este espacio es útil para resolver bloqueos sin perder el contexto de la tarea.",
      "Puedes usarlo para compartir criterios, ejemplos y recordatorios prácticos."
    ],
    heroClass:
      "border-[rgba(46,163,242,0.22)] bg-[linear-gradient(135deg,rgba(46,163,242,0.14),rgba(255,255,255,0.99)_58%,rgba(12,113,195,0.08))]",
    iconClass: "bg-[rgba(46,163,242,0.16)] text-[var(--color-secondary)]",
    accentClass:
      "bg-[linear-gradient(90deg,rgba(46,163,242,0.96),rgba(12,113,195,0.72),rgba(255,182,6,0.28))]",
    softClass: "bg-[rgba(46,163,242,0.1)]"
  },
  general: {
    icon: LayoutList,
    eyebrow: "Vida del curso",
    expectedContent: "Reflexiones, debate y conversación transversal",
    guidance:
      "Espacio abierto para conversaciones del grupo que no encajan en una categoría específica.",
    highlights: [
      "Úsalo para reflexiones, presentaciones y debate entre participantes.",
      "Es la mejor categoría para conversaciones abiertas no ligadas a una tarea concreta.",
      "Conviene mantener los hilos bien titulados para no volverlo difuso."
    ],
    heroClass:
      "border-[rgba(93,104,117,0.18)] bg-[linear-gradient(135deg,rgba(93,104,117,0.1),rgba(255,255,255,0.99)_60%,rgba(255,182,6,0.09))]",
    iconClass: "bg-[rgba(93,104,117,0.12)] text-[var(--color-muted)]",
    accentClass:
      "bg-[linear-gradient(90deg,rgba(93,104,117,0.88),rgba(12,113,195,0.48),rgba(255,182,6,0.34))]",
    softClass: "bg-[rgba(93,104,117,0.08)]"
  },
  "material-adicional": {
    icon: Files,
    eyebrow: "Biblioteca complementaria",
    expectedContent: "Documentos, enlaces y materiales de apoyo",
    guidance:
      "Canal para recursos extra, materiales descargables y referencias útiles para seguir profundizando.",
    highlights: [
      "Ideal para compartir lecturas, guías, vídeos o plantillas de apoyo.",
      "Mantén cada hilo orientado a un recurso o bloque temático concreto.",
      "Conviene describir para qué sirve cada material antes de adjuntarlo."
    ],
    heroClass:
      "border-[rgba(12,113,195,0.18)] bg-[linear-gradient(135deg,rgba(12,113,195,0.1),rgba(255,255,255,0.99)_58%,rgba(46,163,242,0.11))]",
    iconClass: "bg-[rgba(12,113,195,0.1)] text-[var(--color-primary)]",
    accentClass:
      "bg-[linear-gradient(90deg,rgba(12,113,195,0.92),rgba(46,163,242,0.68),rgba(255,182,6,0.28))]",
    softClass: "bg-[rgba(12,113,195,0.08)]"
  }
};

export function getForumCategoryPreset(slug?: string | null) {
  if (!slug) {
    return defaultPreset;
  }

  return categoryPresets[slug] ?? defaultPreset;
}
