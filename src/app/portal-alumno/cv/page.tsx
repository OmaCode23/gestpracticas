import { Badge, Card, CardHeader, CardTitle } from "@/components/ui";

export default function PortalAlumnoCvPage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle icon="CV" iconVariant="purple">
            CV del alumno
          </CardTitle>
        </CardHeader>
        <div className="p-6">
          <div className="rounded-[18px] border border-dashed border-border bg-surface px-5 py-8 text-center">
            <Badge variant="gray">Gestion interna</Badge>
            <h2 className="mt-4 text-lg font-bold text-navy">CV del alumno</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-mid">
              El CV se adjunta, consulta o elimina desde la ficha de cada alumno en el panel interno.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
