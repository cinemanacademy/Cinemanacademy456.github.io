import { useEffect, useMemo, useState } from "react";
import {
  FIELDS,
  GARMENTS,
  fromUnit,
  toUnit,
  type Garment,
  type SavedRecord,
  type Unit,
} from "./measurements";

const STORAGE_KEY = "tailor.records.v1";

function loadRecords(): SavedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedRecord[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [name, setName] = useState("");
  const [garment, setGarment] = useState<Garment>("shirt");
  const [unit, setUnit] = useState<Unit>("cm");
  const [notes, setNotes] = useState("");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<SavedRecord[]>(() => loadRecords());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const activeFields = useMemo(
    () => FIELDS.filter((f) => f.garments.includes(garment)),
    [garment]
  );

  const filledCount = activeFields.filter((f) => inputs[f.key]?.trim()).length;
  const progress = Math.round((filledCount / activeFields.length) * 100);

  function setInput(key: string, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function fieldStatus(key: string): "empty" | "ok" | "warn" {
    const raw = inputs[key];
    if (!raw?.trim()) return "empty";
    const num = Number(raw);
    if (Number.isNaN(num) || num <= 0) return "warn";
    const field = FIELDS.find((f) => f.key === key)!;
    const cm = fromUnit(num, unit);
    if (cm < field.min || cm > field.max) return "warn";
    return "ok";
  }

  // when unit changes, convert displayed values
  function switchUnit(next: Unit) {
    if (next === unit) return;
    setInputs((prev) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const num = Number(v);
        if (!v.trim() || Number.isNaN(num)) {
          out[k] = v;
          continue;
        }
        const cm = fromUnit(num, unit);
        out[k] = String(Math.round(toUnit(cm, next) * 10) / 10);
      }
      return out;
    });
    setUnit(next);
  }

  function resetForm() {
    setName("");
    setNotes("");
    setInputs({});
  }

  function saveRecord() {
    if (!name.trim()) {
      setToast("Please enter a client name first.");
      return;
    }
    const values: Record<string, number> = {};
    for (const f of activeFields) {
      const raw = inputs[f.key];
      if (raw?.trim()) {
        const num = Number(raw);
        if (!Number.isNaN(num)) values[f.key] = fromUnit(num, unit);
      }
    }
    const rec: SavedRecord = {
      id: crypto.randomUUID(),
      name: name.trim(),
      garment,
      unit,
      notes: notes.trim(),
      values,
      createdAt: Date.now(),
    };
    setRecords((prev) => [rec, ...prev]);
    setToast("Measurements saved ✓");
    resetForm();
  }

  function deleteRecord(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  const garmentMeta = GARMENTS.find((g) => g.id === garment)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200 text-stone-800">
      {/* Header */}
      <header className="border-b border-stone-300/70 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-800 text-xl text-amber-50 shadow">
            ✂️
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">
              Atelier Measure
            </h1>
            <p className="text-xs text-stone-500">Bespoke measurement sheet</p>
          </div>
          <div className="ml-auto flex items-center rounded-lg border border-stone-300 bg-white p-0.5 text-sm">
            {(["cm", "in"] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => switchUnit(u)}
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  unit === u
                    ? "bg-stone-800 text-amber-50"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Form */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          {/* Client + garment */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">
                Client name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amelia Hart"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10"
              />
            </label>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-stone-700">
                Garment
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {GARMENTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGarment(g.id)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg border py-2 text-xs transition ${
                      garment === g.id
                        ? "border-stone-800 bg-stone-800 text-amber-50"
                        : "border-stone-300 bg-white text-stone-600 hover:border-stone-500"
                    }`}
                  >
                    <span className="text-base">{g.emoji}</span>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between text-xs text-stone-500">
              <span>
                {garmentMeta.emoji} {garmentMeta.label} measurements
              </span>
              <span>
                {filledCount}/{activeFields.length} filled
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-amber-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Measurement fields */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {activeFields.map((f) => {
              const status = fieldStatus(f.key);
              return (
                <label key={f.key} className="block">
                  <span className="mb-1 flex items-center justify-between text-sm font-medium text-stone-700">
                    {f.label}
                    {status === "warn" && (
                      <span className="text-[11px] font-normal text-amber-700">
                        check value
                      </span>
                    )}
                  </span>
                  <div
                    className={`flex items-center rounded-lg border bg-white pr-3 transition focus-within:ring-2 ${
                      status === "warn"
                        ? "border-amber-400 focus-within:ring-amber-400/20"
                        : status === "ok"
                        ? "border-emerald-400 focus-within:ring-emerald-400/20"
                        : "border-stone-300 focus-within:border-stone-800 focus-within:ring-stone-800/10"
                    }`}
                  >
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      value={inputs[f.key] ?? ""}
                      onChange={(e) => setInput(f.key, e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                    />
                    <span className="text-xs font-medium text-stone-400">
                      {unit}
                    </span>
                  </div>
                  <span className="mt-0.5 block text-[11px] text-stone-400">
                    {f.hint}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Notes */}
          <label className="mt-5 block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Fit preferences, fabric, delivery date…"
              className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10"
            />
          </label>

          <div className="mt-5 flex gap-3">
            <button
              onClick={saveRecord}
              className="flex-1 rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-stone-900"
            >
              Save measurements
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Saved records */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">
              Saved sheets
            </h2>
            <span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs font-medium text-amber-50">
              {records.length}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 p-8 text-center text-sm text-stone-400">
              No measurements yet.
              <br />
              Fill the sheet and save it here.
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => {
                const meta = GARMENTS.find((g) => g.id === r.garment)!;
                return (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-stone-900">
                          {r.name}
                        </h3>
                        <p className="text-xs text-stone-500">
                          {meta.emoji} {meta.label} ·{" "}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteRecord(r.id)}
                        className="rounded-md px-2 py-1 text-xs text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {Object.entries(r.values).map(([k, cm]) => {
                        const field = FIELDS.find((f) => f.key === k);
                        const val =
                          Math.round(toUnit(cm, r.unit) * 10) / 10;
                        return (
                          <div
                            key={k}
                            className="flex justify-between border-b border-dashed border-stone-100 pb-0.5"
                          >
                            <dt className="text-stone-500">
                              {field?.label ?? k}
                            </dt>
                            <dd className="font-medium text-stone-800">
                              {val} {r.unit}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                    {r.notes && (
                      <p className="mt-3 rounded-lg bg-stone-50 p-2 text-xs italic text-stone-500">
                        “{r.notes}”
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-amber-50 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
