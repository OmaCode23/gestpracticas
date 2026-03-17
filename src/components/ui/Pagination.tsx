"use client";

export default function Pagination({ page, total, perPage, onPageChange }: {
  page: number; total: number; perPage: number; onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage + 1;
  const end   = Math.min(page * perPage, total);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="px-6 py-3.5 flex items-center justify-between border-t border-border text-[0.8rem] text-text-light">
      <span>Mostrando {start}–{end} de {total}</span>
      <div className="flex gap-1">
        <Btn onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>‹</Btn>
        {pages.map(p => <Btn key={p} active={page === p} onClick={() => onPageChange(p)}>{p}</Btn>)}
        {totalPages > 5 && <><Btn disabled>...</Btn><Btn active={page === totalPages} onClick={() => onPageChange(totalPages)}>{totalPages}</Btn></>}
        <Btn onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>›</Btn>
      </div>
    </div>
  );
}

function Btn({ children, active = false, disabled = false, onClick }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-[30px] h-[30px] rounded-md border text-[0.8rem] flex items-center justify-center transition-all duration-150",
        active   ? "bg-blue-light text-white border-blue-light" : "bg-white text-text-mid border-border hover:bg-blue-light hover:text-white hover:border-blue-light",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
