import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

export default function UsersPagination({ page, pageSize, totalItems, onPageChange, onPageSizeChange, t }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = Math.min(clampedPage * pageSize, totalItems);

  const Btn = ({ onClick, disabled, children, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-1.5 rounded-lg border transition disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
      style={{ borderColor: t.border, background: t.surface, color: t.textSecondary }}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: t.border, background: t.surfaceMuted }}>
      <div className="flex items-center gap-2 text-xs" style={{ color: t.textSecondary }}>
        <span>Showing <span className="font-bold" style={{ color: t.textPrimary }}>{start}–{end}</span> of <span className="font-bold" style={{ color: t.textPrimary }}>{totalItems}</span></span>
        <span className="mx-1 opacity-40">·</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: t.textMuted }}>Rows per page:</span>
        <BottomSheetSelect
          value={String(pageSize)}
          onChange={(val) => onPageSizeChange(Number(val))}
          options={[
            { value: "25", label: "25" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
            { value: "200", label: "200" }
          ]}
          triggerClassName="!py-0.5 !px-1.5 !text-xs !font-semibold !rounded !min-w-[60px]"
          triggerStyle={{ background: "transparent", borderColor: t.border, color: t.textPrimary }}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Btn onClick={() => onPageChange(1)} disabled={clampedPage <= 1} title="First page"><ChevronsLeft size={13} /></Btn>
        <Btn onClick={() => onPageChange(clampedPage - 1)} disabled={clampedPage <= 1} title="Previous"><ChevronLeft size={13} /></Btn>
        <span className="px-3 py-1 text-xs font-bold" style={{ color: t.textPrimary }}>
          Page {clampedPage} of {totalPages}
        </span>
        <Btn onClick={() => onPageChange(clampedPage + 1)} disabled={clampedPage >= totalPages} title="Next"><ChevronRight size={13} /></Btn>
        <Btn onClick={() => onPageChange(totalPages)} disabled={clampedPage >= totalPages} title="Last page"><ChevronsRight size={13} /></Btn>
      </div>
    </div>
  );
}