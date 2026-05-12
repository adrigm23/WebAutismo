import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-4xl items-center px-6 py-14 lg:px-8">
      <Card className="w-full p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
          Error 404
        </p>
        <h1 className="mt-4 font-display text-4xl text-[var(--color-ink)]">
          No hemos encontrado la pagina que buscas
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
          Puede que el curso ya no exista o que la URL no sea correcta.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/cursos">Volver a cursos</ButtonLink>
        </div>
      </Card>
    </div>
  );
}
