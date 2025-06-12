// الجزء المعدل والمدمج بالكامل

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey?: keyof T | ((row: T) => React.ReactNode);
    cell?: (row: T, index?: number) => React.ReactNode;
    meta?: {
      className?: string;
    };
    id?: string;
    hidden?: boolean;
  }[];
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  actions?: React.ReactNode;
  onRowClick?: (row: T) => void;
  dir?: 'ltr' | 'rtl';
  isLoading?: boolean;
  highlightNewRows?: boolean;
  animateChanges?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  searchable = true,
  pagination = true,
  pageSize: externalPageSize,
  currentPage: externalCurrentPage,
  onPageChange: externalPageChange,
  onPageSizeChange: externalPageSizeChange,
  actions,
  onRowClick,
  dir = 'ltr',
  isLoading = false,
  highlightNewRows = true,
  animateChanges = true,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [newRowsSet, setNewRowsSet] = useState<Set<number>>(new Set());
  const [previousDataLength, setPreviousDataLength] = useState(data.length);

  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
  const pageSize = externalPageSize !== undefined ? externalPageSize : internalPageSize;

  useEffect(() => {
    if (highlightNewRows && data.length > previousDataLength) {
      const newRows = new Set<number>();
      for (let i = previousDataLength; i < data.length; i++) {
        newRows.add(i);
      }
      setNewRowsSet(newRows);
      const timer = setTimeout(() => setNewRowsSet(new Set()), 3000);
      setPreviousDataLength(data.length);
      return () => clearTimeout(timer);
    } else {
      setPreviousDataLength(data.length);
    }
  }, [data.length, previousDataLength, highlightNewRows]);

  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery) return data;
    return data.filter((row) =>
      Object.entries(row as Record<string, any>).some(([_, value]) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, searchable]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  const handlePageChange = (page: number) => {
    if (externalPageChange) externalPageChange(page);
    else setInternalCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    if (externalPageSizeChange) {
      externalPageSizeChange(newSize);
      if (externalPageChange) externalPageChange(1);
    } else {
      setInternalPageSize(newSize);
      setInternalCurrentPage(1);
    }
  };

  const direction = isRTL ? 'rtl' : 'ltr';
  const isRightToLeft = isRTL;

  const getAbsoluteRowIndex = (relativeIndex: number): number => {
    return (currentPage - 1) * pageSize + relativeIndex;
  };

  return (
    <div className={`space-y-4 ${isRightToLeft ? 'rtl' : 'ltr'}`} dir={direction}>
      {(searchable || actions) && (
        <div className={`flex items-center justify-between ${isRightToLeft ? 'flex-row-reverse' : ''}`}>
          {searchable && (
            <div className="relative w-64">
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handlePageChange(1);
                }}
                className={`text-sm ${isRightToLeft ? "text-right pr-10" : "text-left pl-10"}`}
              />
              <span className={`absolute ${isRightToLeft ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`}>🔍</span>
            </div>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {(isRightToLeft ? [...columns].reverse() : columns).filter(col => !col.hidden).map((col, idx) => (
                <TableHead key={idx} className="text-center font-bold">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="animate-pulse">
                  {(isRightToLeft ? [...columns].reverse() : columns).filter(col => !col.hidden).map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`} className="p-4">
                      <div className="h-6 bg-gray-300 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => {
                const absIndex = getAbsoluteRowIndex(rowIndex);
                const isNew = newRowsSet.has(absIndex);
                const isHover = hoveredRow === rowIndex;

                return (
                  <TableRow
                    key={(row as any).id ?? `row-${absIndex}`}
                    onClick={(e) => {
                      if (onRowClick && !(e.target as HTMLElement).closest('button,a')) {
                        onRowClick(row);
                      }
                    }}
                    onMouseEnter={() => setHoveredRow(rowIndex)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isHover ? 'bg-blue-50' : ''} ${isNew ? 'bg-green-50' : ''}`}
                  >
                    {(isRightToLeft ? [...columns].reverse() : columns).filter(col => !col.hidden).map((col, colIndex) => (
                      <TableCell key={colIndex} className="text-center">
                        {col.cell
                          ? col.cell(row, absIndex)
                          : typeof col.accessorKey === 'function'
                          ? col.accessorKey(row)
                          : col.accessorKey
                          ? (row[col.accessorKey as keyof T] as React.ReactNode)
                          : null}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24">
                  {t("pagination.no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && totalPages > 0 && (
        <div className={`flex items-center justify-between ${isRightToLeft ? 'flex-row-reverse' : ''}`}>
          <div className={`text-sm text-gray-500 ${isRightToLeft ? 'text-right' : ''}`}>
            {t("pagination.showing_entries", {
              from: Math.min(filteredData.length, (currentPage - 1) * pageSize + 1),
              to: Math.min(filteredData.length, currentPage * pageSize),
              total: filteredData.length
            })}
          </div>
          <div className={`flex items-center ${isRightToLeft ? 'flex-row-reverse gap-x-2' : 'gap-x-2'}`}>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
              <span className="material-icons text-sm">{isRightToLeft ? 'last_page' : 'first_page'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <span className="material-icons text-sm">{isRightToLeft ? 'chevron_right' : 'chevron_left'}</span>
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage > 3 && totalPages > 5 ? currentPage - 3 + i + 1 : i + 1;
              return page <= totalPages ? (
                <Button key={i} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)}>
                  {page}
                </Button>
              ) : null;
            })}
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <span className="material-icons text-sm">{isRightToLeft ? 'chevron_left' : 'chevron_right'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
              <span className="material-icons text-sm">{isRightToLeft ? 'first_page' : 'last_page'}</span>
            </Button>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
