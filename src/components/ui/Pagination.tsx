"use client";

export default function Pagination({
  page,
  total,
  perPage,
  onPageChange,
}: {
  page: number;
  total: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-3.5 text-[0.8rem] text-text-light">
      <span>
        Mostrando {start}-{end} de {total}
      </span>
      <div className="flex gap-1">
        <Btn onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
          {"<"}
        </Btn>
        {pages.map((p) => (
          <Btn key={p} active={page === p} onClick={() => onPageChange(p)}>
            {p}
          </Btn>
        ))}
        {totalPages > 5 && (
          <>
            <Btn disabled>...</Btn>
            <Btn active={page === totalPages} onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </Btn>
          </>
        )}
        <Btn
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          {">"}
        </Btn>
      </div>
    </div>
  );
}

function Btn({
  children,
  active = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex h-[30px] w-[30px] items-center justify-center rounded-md border text-[0.8rem] transition-all duration-150",
        active
          ? "border-blue-light bg-blue-light text-white"
          : "border-border bg-white text-text-mid hover:border-blue-light hover:bg-blue-light hover:text-white",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
