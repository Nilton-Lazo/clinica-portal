import * as React from "react";
import type { ModalidadFechasProgramacion } from "../types/programacionMedica.types";
import { SelectMenu, type SelectOption } from "../../../../../shared/ui/SelectMenu";
import { ChevronLeft, ChevronRight } from "lucide-react";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function ymd(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function inRange(d: Date, a: Date, b: Date) {
  const x = ymd(d);
  const aa = ymd(a);
  const bb = ymd(b);
  if (aa <= bb) return x >= aa && x <= bb;
  return x >= bb && x <= aa;
}

const monthNames = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function ProgramacionCalendarCard(props: {
  modalidad: ModalidadFechasProgramacion;
  onModalidadChange: (m: ModalidadFechasProgramacion) => void;
  enabledEditModalidad: boolean;

  selectedDate: Date;
  selectedDates: Date[];
  rangeStart: Date | null;
  rangeEnd: Date | null;

  onPickDaily: (d: Date) => void;
  onToggleRandom: (d: Date) => void;
  onPickRange: (d: Date) => void;
}) {
  const {
    modalidad,
    onModalidadChange,
    enabledEditModalidad,
    selectedDate,
    selectedDates,
    rangeStart,
    rangeEnd,
    onPickDaily,
    onToggleRandom,
    onPickRange,
  } = props;

  const [month, setMonth] = React.useState<Date>(() => startOfMonth(selectedDate));
  React.useEffect(() => {
    setMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const modalidadOptions: SelectOption[] = [
    { value: "DIARIA", label: "Programación diaria" },
    { value: "ALEATORIA", label: "Programación aleatoria" },
    { value: "RANGO", label: "Programación por rango de fechas" },
  ];

  const today = React.useMemo(() => new Date(), []);

  const first = startOfMonth(month);
  const offset = first.getDay();
  const total = daysInMonth(month);

  const cells: Array<{ date: Date | null; key: string }> = [];
  for (let i = 0; i < offset; i++) cells.push({ date: null, key: `e-${i}` });
  for (let d = 1; d <= total; d++) cells.push({ date: new Date(month.getFullYear(), month.getMonth(), d), key: `d-${d}` });
  while (cells.length % 7 !== 0) cells.push({ date: null, key: `t-${cells.length}` });

  const isSelected = (d: Date) => selectedDates.some((x) => sameDay(x, d));
  const isRangeStart = (d: Date) => !!rangeStart && sameDay(rangeStart, d);
  const isRangeEnd = (d: Date) => !!rangeEnd && sameDay(rangeEnd, d);

  const isInRange = (d: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    return inRange(d, rangeStart, rangeEnd);
  };

  const onPick = (d: Date) => {
    if (modalidad === "DIARIA") onPickDaily(d);
    else if (modalidad === "ALEATORIA") onToggleRandom(d);
    else onPickRange(d);
  };

  const cellBorder = "border-b border-r border-(--border-color-default) last:border-r-0";

  return (
    <div className="h-full rounded-2xl border border-(--border-color-default) bg-(--color-surface) p-4">
      <div className="flex h-full flex-col gap-3">
        <div>
          <div className="text-sm font-semibold text-(--color-text-primary)">Modalidad de fechas</div>
          <div className="mt-1">
            <SelectMenu
              value={modalidad}
              onChange={(v) => onModalidadChange(v as ModalidadFechasProgramacion)}
              options={modalidadOptions}
              ariaLabel="Modalidad de fechas"
              buttonClassName="w-full"
              menuClassName="min-w-full"
              disabled={!enabledEditModalidad}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-2xl border border-(--border-color-default) overflow-hidden">
          <div className="flex items-center justify-between bg-(--color-panel-context) px-3 py-2">
            <button
              type="button"
              className="h-8 w-10 rounded-xl border border-(--border-color-default) bg-(--color-surface) text-(--color-text-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="mx-auto h-4 w-4" />
            </button>

            <div className="text-sm font-semibold text-(--color-text-primary)">
              {monthNames[month.getMonth()]} {month.getFullYear()}
            </div>

            <button
              type="button"
              className="h-8 w-10 rounded-xl border border-(--border-color-default) bg-(--color-surface) text-(--color-text-primary) transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="mx-auto h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 bg-(--color-surface)">
            {weekdays.map((w) => (
              <div
                key={w}
                className="border-b border-(--border-color-default) px-2 py-2 text-center text-xs font-semibold text-(--color-text-secondary)"
              >
                {w}
              </div>
            ))}

            {cells.map((c) => {
              if (!c.date) return <div key={c.key} className={`h-10 ${cellBorder}`} />;

              const d = c.date;

              const isToday = sameDay(d, today);

              const dailyActive = modalidad === "DIARIA" && sameDay(d, selectedDate);
              const randomActive = modalidad === "ALEATORIA" && isSelected(d);

              const rangeEdge = modalidad === "RANGO" && (isRangeStart(d) || isRangeEnd(d));
              const inBetween = modalidad === "RANGO" && isInRange(d) && !rangeEdge;

              const activeRing = dailyActive || randomActive || rangeEdge;

              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onPick(d)}
                  className={[
                    `h-10 ${cellBorder}`,
                    "relative text-sm tabular-nums transition-colors",
                    "flex items-center justify-center",
                    // rango entre inicio/fin
                    inBetween ? "bg-(--color-panel-options-bg) text-(--color-text-primary)" : "bg-(--color-surface) text-(--color-text-primary)",
                    // recuadro de seleccion
                    activeRing ? "ring-2 ring-(--color-primary) ring-inset bg-(--color-panel-options-bg) font-semibold" : "",
                    // hover solo si no está seleccionado
                    !activeRing ? "hover:bg-(--color-panel-options-bg)" : "",
                  ].join(" ")}
                  aria-label={`Seleccionar ${ymd(d)}`}
                >
                  <span className="relative">
                    {d.getDate()}

                    {isToday ? (
                      <span
                        className="absolute -bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-(--color-primary)"
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-(--color-text-secondary)">
          {modalidad === "DIARIA"
            ? "Selecciona una fecha."
            : modalidad === "ALEATORIA"
              ? "Selecciona varias fechas (toggle)."
              : "Selecciona inicio y fin (click inicio, luego fin)."}
        </div>
      </div>
    </div>
  );
}
