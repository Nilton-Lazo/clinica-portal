function SummaryItem(props: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="text-xs text-(--color-text-secondary) whitespace-nowrap">{props.label}:</div>
      <div className="text-sm text-(--color-text-primary) font-medium truncate">{props.value}</div>
    </div>
  );
}

export default function PacienteSummaryBar(props: {
  hc: string;
  nombre: string;
  nr: string;
  edad: string;
  sexo: string;
  estado: string;
}) {
  const { hc, nombre, nr, edad, sexo, estado } = props;

  return (
    <div className="rounded-2xl border border-(--border-color-default) bg-(--color-surface) px-4 py-3">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <SummaryItem label="HC" value={hc} />
        <SummaryItem label="Paciente" value={nombre} />
        <SummaryItem label="NR" value={nr} />
        <SummaryItem label="Edad" value={edad === "—" ? "—" : `${edad} años`} />
        <SummaryItem label="Sexo" value={sexo} />
        <SummaryItem label="Estado" value={estado} />
      </div>
    </div>
  );
}
