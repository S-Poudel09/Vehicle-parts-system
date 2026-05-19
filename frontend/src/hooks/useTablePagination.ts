import { useEffect, useState } from "react";
import { ADMIN_TABLE_PAGE_SIZE } from "../constants/adminPagination";

export function useTablePagination<T>(
  items: T[],
  pageSize: number = ADMIN_TABLE_PAGE_SIZE
) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    pageSize,
    resetPage: () => setCurrentPage(1),
  };
}
