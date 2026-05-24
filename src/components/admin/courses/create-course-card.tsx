import { createCourseAction } from "@/actions/admin";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { SurfaceCard } from "@/components/ui/surface-card";

export function CreateCourseCard() {
  return (
    <SurfaceCard
      description="Crea la ficha base del curso, su precio y una primera edicion activa. Despues podras completar modulos, asignar docentes y ajustar el contenido desde el detalle del curso."
      id="create-course"
      title="Crear curso desde cero"
    >
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
    </SurfaceCard>
  );
}
