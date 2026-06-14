import type { CatalogCourse } from "@/lib/course-catalog";
import { cn } from "@/lib/utils";

type CourseArtworkProps = {
  course: CatalogCourse;
  className?: string;
  variant?: "card" | "hero" | "thumb" | "player";
};

type ArtworkTheme = {
  background: string;
  accent: string;
  secondary: string;
  tertiary: string;
  shape: "slab" | "arch" | "portrait" | "initials";
};

const artworkThemes: Record<string, ArtworkTheme> = {
  "nociones-basicas-sobre-apoyo-conductual-positivo-para-profesionales": {
    background: "linear-gradient(135deg, #0a1d2f 0%, #10283c 48%, #07131f 100%)",
    accent: "#6fd6ff",
    secondary: "#86b8ff",
    tertiary: "#123d5d",
    shape: "slab"
  },
  "adaptaciones-en-el-aula-para-estudiantes-con-autismo": {
    background: "linear-gradient(135deg, #dff3ff 0%, #a7dfff 48%, #f4f8fb 100%)",
    accent: "#0c93d8",
    secondary: "#ffd34d",
    tertiary: "#48b0e0",
    shape: "arch"
  },
  "comunicacion-funcional-en-autismo": {
    background: "linear-gradient(135deg, #271d17 0%, #4a2615 42%, #121f15 100%)",
    accent: "#e09459",
    secondary: "#f4b17d",
    tertiary: "#141f13",
    shape: "portrait"
  }
};

function getArtworkTheme(course: CatalogCourse) {
  return (
    artworkThemes[course.slug] ?? {
      background: `linear-gradient(135deg, ${course.accentFrom} 0%, ${course.accentTo} 100%)`,
      accent: "#cce6ff",
      secondary: "#ffe28a",
      tertiary: "#16324a",
      shape: "initials" as const
    }
  );
}

const STOP_WORDS = new Set(["de", "del", "la", "el", "en", "para", "y", "e", "a", "con", "por", "sobre", "los", "las", "un", "una"]);

function getCourseInitials(title: string): string {
  const words = title.split(/\s+/).filter(Boolean).filter(w => !STOP_WORDS.has(w.toLowerCase()));
  const initials = words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  if (initials) return initials;
  const first = title[0];
  return first ? first.toUpperCase() : "C";
}

export function CourseArtwork({
  course,
  className,
  variant = "card"
}: CourseArtworkProps) {
  const theme = getArtworkTheme(course);
  const isPlayer = variant === "player";
  const isThumb = variant === "thumb";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-[rgba(255,255,255,0.16)]",
        className
      )}
      style={{ background: theme.background }}
    >
      {course.coverImageUrl ? (
        <img
          src={course.coverImageUrl}
          alt={course.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.08),transparent_20%)]" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.28))]" />

      {theme.shape === "slab" ? (
        <>
          <div
            className={cn(
              "absolute left-1/2 top-[58%] -translate-x-1/2 rounded-sm border border-white/20 shadow-[0_18px_30px_rgba(0,0,0,0.28)]",
              isThumb ? "h-10 w-28" : isPlayer ? "h-28 w-72" : variant === "hero" ? "h-24 w-64" : "h-16 w-40"
            )}
            style={{
              background: `linear-gradient(180deg, ${theme.accent}, ${theme.secondary})`,
              transform: "translateX(-50%) perspective(220px) rotateX(62deg)"
            }}
          />
          <div className="absolute left-1/2 top-[42%] h-px w-16 -translate-x-1/2 bg-white/70 md:w-20" />
          <div className="absolute left-[calc(50%+1.2rem)] top-[41.2%] h-2 w-2 rotate-45 border-r border-t border-white/80" />
          {null}
        </>
      ) : null}

      {theme.shape === "arch" ? (
        <>
          <div
            className={cn(
              "absolute left-[14%] top-[12%] rounded-t-[28%] rounded-b-none",
              isThumb ? "h-20 w-24" : isPlayer ? "h-72 w-72" : variant === "hero" ? "h-56 w-56" : "h-40 w-44"
            )}
            style={{ background: "rgba(255,255,255,0.42)" }}
          />
          <div
            className={cn(
              "absolute left-[34%] top-[34%]",
              isThumb
                ? "h-[5.5rem] w-16"
                : isPlayer
                  ? "h-56 w-36"
                  : variant === "hero"
                    ? "h-44 w-28"
                    : "h-[7.5rem] w-20"
            )}
            style={{ background: theme.accent }}
          />
          <div
            className={cn(
              "absolute",
              isThumb ? "left-[62%] top-[18%] h-0 w-0 border-b-[22px] border-l-[14px] border-r-[14px]" : "left-[56%] top-[16%] h-0 w-0 border-b-[34px] border-l-[22px] border-r-[22px]"
            )}
            style={{
              borderBottomColor: theme.secondary,
              borderLeftColor: "transparent",
              borderRightColor: "transparent"
            }}
          />
        </>
      ) : null}

      {theme.shape === "portrait" ? (
        <>
          <div
            className={cn(
              "absolute rounded-[42%] blur-[1px]",
              isThumb
                ? "right-[18%] top-[10%] h-[6.5rem] w-20"
                : isPlayer
                  ? "right-[18%] top-[8%] h-80 w-56"
                  : variant === "hero"
                    ? "right-[18%] top-[10%] h-60 w-44"
                    : "right-[18%] top-[14%] h-44 w-[7.5rem]"
            )}
            style={{ background: theme.secondary }}
          />
          <div
            className={cn(
              "absolute rounded-full",
              isThumb ? "right-[27%] top-[16%] h-10 w-10" : isPlayer ? "right-[29%] top-[15%] h-28 w-28" : variant === "hero" ? "right-[29%] top-[16%] h-20 w-20" : "right-[28%] top-[19%] h-14 w-14"
            )}
            style={{ background: theme.accent }}
          />
          <div
            className={cn(
              "absolute rounded-full bg-[#2a1a12]",
              isThumb ? "right-[34%] top-[22%] h-2.5 w-2.5" : isPlayer ? "right-[36%] top-[24%] h-5 w-5" : variant === "hero" ? "right-[36%] top-[24%] h-4 w-4" : "right-[35%] top-[25%] h-3 w-3"
            )}
          />
          <div
            className={cn(
              "absolute rounded-full bg-[#2a1a12]",
              isThumb ? "right-[24%] top-[22%] h-2.5 w-2.5" : isPlayer ? "right-[24%] top-[24%] h-5 w-5" : variant === "hero" ? "right-[24%] top-[24%] h-4 w-4" : "right-[24%] top-[25%] h-3 w-3"
            )}
          />
        </>
      ) : null}

      {/* Initials fallback — for courses without a specific artwork theme */}
      {theme.shape === "initials" ? (
        <>
          {/* Background circle decoration */}
          <div
            className="absolute -right-8 -top-8 rounded-full opacity-20"
            style={{
              width: isThumb ? "80px" : "140px",
              height: isThumb ? "80px" : "140px",
              background: "rgba(255,255,255,0.3)"
            }}
          />
          <div
            className="absolute -bottom-6 -left-6 rounded-full opacity-15"
            style={{
              width: isThumb ? "60px" : "100px",
              height: isThumb ? "60px" : "100px",
              background: "rgba(255,255,255,0.4)"
            }}
          />
          {/* Course initials — centered, prominent */}
          {!isThumb ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="select-none font-black text-white drop-shadow-lg"
                style={{
                  fontSize: isPlayer ? "5rem" : variant === "hero" ? "4rem" : "3rem",
                  letterSpacing: "-0.02em",
                  textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                  opacity: 0.72
                }}
              >
                {getCourseInitials(course.title)}
              </span>
            </div>
          ) : null}
        </>
      ) : null}
        </>
      )}

      {!isThumb ? (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
          <span>{course.category}</span>
          {!isPlayer ? <span>{course.level}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
