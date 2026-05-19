import { createCourseAction } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateCourseCard() {
  return (
    <Card className="rounded-[2rem] p-7" id="create-course">
      <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--color-ink)]">
        Crear curso desde cero
      </h2>
      <p className="mt-3 text-sm leading-7 text-[#5f7083]">
        Crea la ficha base del curso, su precio y una primera edicion activa.
        Despues podras completar módulos, asignar docentes y ajustar el
        contenido desde el detalle del curso.
      </p>
      <form action={createCourseAction} className="mt-5 space-y-4">
        <Input name="title" placeholder="Titulo del curso" required />
        <Input name="slug" placeholder="slug-del-curso" required />
        <Input
          name="shortDescription"
          placeholder="Descripcion corta"
          required
        />
        <Input
          min="0"
          name="priceInCents"
          placeholder="Precio en centimos"
          required
          type="number"
        />
        <SubmitButton className="w-full" pendingLabel="Creando curso...">
          Crear curso
        </SubmitButton>
      </form>
    </Card>
  );
}
