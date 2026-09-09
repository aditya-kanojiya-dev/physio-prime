import { useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
};

export function ChipMultiSelect({ value, onChange, options, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selected = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const q = query.trim().toLowerCase();
  const filtered = options.filter((o) => !selected.includes(o) && o.toLowerCase().includes(q));
  const canAdd = q !== '' && !options.some((o) => o.toLowerCase() === q);

  function add(item: string) {
    if (!selected.includes(item)) onChange([...selected, item].join(', '));
    setQuery('');
    setOpen(true);
  }

  function remove(item: string) {
    onChange(selected.filter((x) => x !== item).join(', '));
  }

  function onSubmit() {
    if (canAdd) add(query.trim());
    else if (filtered.length > 0) add(filtered[0]);
  }

  return (
    <div className="relative space-y-1.5">
      <div>
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
          className="w-full px-3 py-2 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/40 placeholder:text-slate-400"
          placeholder={placeholder ?? 'Search specialties or type a new one...'}
        />
        {open && (q !== '' || filtered.length > 0) && (
          <div className="absolute z-20 mt-1 w-full max-h-44 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-lg p-1.5 space-y-0.5">
            {filtered.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => add(opt)}
                className="block w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
              >
                {opt}
              </button>
            ))}
            {canAdd && (
              <button
                type="button"
                onClick={() => add(query.trim())}
                className="block w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-teal-700 hover:bg-teal-50"
              >
                + Add “{query.trim()}”
              </button>
            )}
            {filtered.length === 0 && !canAdd && <div className="px-2.5 py-1.5 text-[11px] text-slate-400">No matches</div>}
          </div>
        )}
      </div>
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => remove(item)}
              title="Remove"
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-teal-600 bg-teal-600 text-white transition-all"
            >
              {item} ✕
            </button>
          ))}
        </div>
      )}
    </div>
  );
}