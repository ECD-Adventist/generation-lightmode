import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";

/**
 * Native-feeling mobile bottom sheet select.
 * - Tapping the trigger opens a slide-up sheet with large tappable rows.
 * - Supports optional search when `searchable` is true.
 * - Falls back gracefully on desktop (just renders as a modal sheet).
 *
 * Props:
 *   value, onChange: controlled value
 *   options: array of strings OR { value, label } objects
 *   placeholder, label, searchable (default true when >8 options)
 *   triggerClassName, triggerStyle: override trigger look
 *   disabled
 */
export default function BottomSheetSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  searchable,
  triggerClassName = "",
  triggerStyle,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalized = useMemo(
    () => options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)),
    [options]
  );

  const shouldSearch = typeof searchable === "boolean" ? searchable : normalized.length > 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [normalized, query]);

  const selectedLabel = normalized.find((o) => o.value === value)?.label;

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition text-left ${triggerClassName}`}
        style={triggerStyle || { background: "#F6F8FC", border: "1px solid #E6ECF5", color: selectedLabel ? "#0B1B3D" : "#8A97B5" }}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "rgba(11, 27, 61, 0.55)", backdropFilter: "blur(4px)" }}
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sheet */}
            <motion.div
              className="relative w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
              style={{ background: "#FFFFFF", maxHeight: "min(calc(100dvh - env(safe-area-inset-top) - 1rem), 640px)", boxShadow: "0 -12px 40px rgba(11, 27, 61, 0.25)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Drag handle */}
              <div className="pt-3 pb-2 flex justify-center sm:hidden">
                <div className="w-10 h-1.5 rounded-full" style={{ background: "#D6E4FF" }} />
              </div>

              <div className="px-5 pt-1 pb-3 flex items-center justify-between border-b" style={{ borderColor: "#E6ECF5" }}>
                <h3 className="font-black text-base font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>
                  {placeholder}
                </h3>
                <button type="button" onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: "#6B7FA0" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {shouldSearch && (
                <div className="px-5 py-3 border-b" style={{ borderColor: "#E6ECF5" }}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8A97B5" }} />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search…"
                      className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
                    />
                  </div>
                </div>
              )}

              <div className="overflow-y-auto flex-1">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm" style={{ color: "#8A97B5" }}>No results.</div>
                ) : (
                  filtered.map((o) => {
                    const isSelected = o.value === value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          onChange(o.value);
                          close();
                        }}
                        className="w-full flex items-center justify-between px-5 py-4 text-left transition active:bg-[#F6F8FC]"
                        style={{ borderBottom: "1px solid #F0F4FA" }}
                      >
                        <span className="text-sm font-medium" style={{ color: isSelected ? "#0B3FD9" : "#0B1B3D" }}>
                          {o.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4" style={{ color: "#0B3FD9" }} />}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="h-[env(safe-area-inset-bottom)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}