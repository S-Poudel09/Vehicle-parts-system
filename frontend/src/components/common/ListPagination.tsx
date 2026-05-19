type ListPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function ListPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ListPaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
      <button
        type="button"
        className="btn-secondary"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Prev
      </button>
      <span>
        Page {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="btn-secondary"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
