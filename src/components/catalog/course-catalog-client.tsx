"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import type { CatalogCourse } from "@/lib/course-catalog";
import { CourseCardCatalog } from "./course-card-catalog";

const ITEMS_PER_PAGE = 6;

const LEVELS = ["Todos los niveles", "Básico", "Intermedio", "Avanzado"];

type Props = {
  courses: CatalogCourse[];
};

export function CourseCatalogClient({ courses }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("Todos los niveles");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(courses.map((c) => c.category));
    return Array.from(cats);
  }, [courses]);

  const filtered = useMemo(() => {
    let result = [...courses];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.shortDescription.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((c) => selectedCategories.includes(c.category));
    }

    if (selectedLevel !== "Todos los niveles") {
      result = result.filter((c) => c.level === selectedLevel);
    }

    if (sort === "price-asc") result.sort((a, b) => a.priceInCents - b.priceInCents);
    if (sort === "price-desc") result.sort((a, b) => b.priceInCents - a.priceInCents);

    return result;
  }, [courses, search, selectedCategories, selectedLevel, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
    setPage(1);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-white pb-12 pt-14 text-center">
        <div className="site-container">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-ink)] sm:text-[2.8rem]">
            Explora nuestro Catálogo de Cursos
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted)]">
            Encuentra formación especializada y herramientas prácticas diseñadas por expertos para
            profesionales, educadores y familias.
          </p>
          <div className="mx-auto mt-8 flex max-w-[540px] items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-5 py-3 shadow-sm">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
            <input
              className="flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por tema, instructor o palabra clave..."
              type="text"
              value={search}
            />
          </div>
        </div>
      </section>

      {/* Catalog body */}
      <div className="bg-[#f3f4f6] py-10">
        <div className="site-container flex gap-8">
          {/* Sidebar — hidden on mobile, visible on lg+ */}
          <aside className="hidden w-52 shrink-0 lg:block">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Especialidad
              </p>
              <ul className="mt-3 space-y-2.5">
                {categories.map((cat) => (
                  <li key={cat}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-ink)]">
                      <input
                        checked={selectedCategories.includes(cat)}
                        className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                        onChange={() => toggleCategory(cat)}
                        type="checkbox"
                      />
                      {cat}
                    </label>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Nivel
              </p>
              <ul className="mt-3 space-y-2.5">
                {LEVELS.map((level) => (
                  <li key={level}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-ink)]">
                      <input
                        checked={selectedLevel === level}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                        name="level-filter"
                        onChange={() => {
                          setSelectedLevel(level);
                          setPage(1);
                        }}
                        type="radio"
                      />
                      {level}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">
            {/* Mobile filters toggle */}
            <div className="mb-4 lg:hidden">
              <button
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-primary)]"
                onClick={() => setFiltersOpen((v) => !v)}
                type="button"
              >
                {filtersOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
                {filtersOpen ? "Cerrar filtros" : "Filtros"}
              </button>
              {filtersOpen && (
                <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-white p-5">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">Especialidad</p>
                  <ul className="mt-3 space-y-2.5">
                    {categories.map((cat) => (
                      <li key={cat}>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-ink)]">
                          <input
                            checked={selectedCategories.includes(cat)}
                            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                            onChange={() => toggleCategory(cat)}
                            type="checkbox"
                          />
                          {cat}
                        </label>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">Nivel</p>
                  <ul className="mt-3 space-y-2.5">
                    {LEVELS.map((level) => (
                      <li key={level}>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-ink)]">
                          <input
                            checked={selectedLevel === level}
                            className="h-4 w-4 accent-[var(--color-primary)]"
                            name="level-filter-mobile"
                            onChange={() => { setSelectedLevel(level); setPage(1); }}
                            type="radio"
                          />
                          {level}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Top bar */}
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm text-[var(--color-muted)]">
                Mostrando {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="relative">
                <select
                  className="appearance-none rounded-lg border border-[var(--color-border)] bg-white py-2 pl-3 pr-8 text-sm font-medium text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  value={sort}
                >
                  <option value="recent">Más recientes</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]" />
              </div>
            </div>

            {/* Grid */}
            {paginated.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {paginated.map((course) => (
                  <CourseCardCatalog course={course} key={course.slug} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-[var(--color-muted)]">
                No se encontraron cursos con esos filtros.
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-ink)] transition hover:border-[var(--color-primary)] disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    className={`h-9 w-9 rounded-lg border text-sm font-medium transition ${
                      n === page
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)]"
                    }`}
                    key={n}
                    onClick={() => setPage(n)}
                    type="button"
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-ink)] transition hover:border-[var(--color-primary)] disabled:opacity-40"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
