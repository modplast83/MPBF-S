import { useState } from "react";
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
    cell?: (row: T) => React.ReactNode;
    meta?: {
      className?: string;
    };
    id?: string;
  }[];
  searchable?: boolean;
  pagination?: boolean;
  actions?: React.ReactNode;
  onRowClick?: (row: T) => void;
  dir?: 'ltr' | 'rtl';
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  searchable = true,
  pagination = true,
  actions,
  onRowClick,
  dir = 'ltr',
  isLoading = false,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Filter data based on search query
  const filteredData = searchable && searchQuery
    ? data.filter((row) =>
        Object.entries(row as Record<string, any>).some(([key, value]) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data;

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  // Use the dir prop or fallback to isRTL from context
  const direction = dir || (isRTL ? 'rtl' : 'ltr');
  const isRightToLeft = direction === 'rtl';
  
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
                  setCurrentPage(1); // Reset to first page
                }}
                className={isRightToLeft ? "pr-10 text-right" : "pl-10"}
              />
              <span className={`absolute ${isRightToLeft ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`}>
                <span className="material-icons text-sm">search</span>
              </span>
            </div>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={`font-semibold ${column.meta?.className || ''} ${isRightToLeft ? 'text-right' : ''}`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`}>
                      <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={(e) => {
                    // Only trigger row click if not clicking on an action button
                    if (onRowClick && 
                        e.target && 
                        !((e.target as HTMLElement).closest('button') || 
                          (e.target as HTMLElement).closest('a'))) {
                      onRowClick(row);
                    }
                  }}
                  className={onRowClick ? "cursor-pointer hover:bg-secondary-50" : ""}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell 
                      key={colIndex}
                      className={column.meta?.className || ''}
                    >
                      {column.cell
                        ? column.cell(row)
                        : typeof column.accessorKey === "function"
                        ? column.accessorKey(row)
                        : column.accessorKey 
                          ? (row[column.accessorKey as keyof T] as React.ReactNode)
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
          <div className={`flex items-center ${isRightToLeft ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
            <div className={`flex items-center ${isRightToLeft ? 'space-x-reverse space-x-1 flex-row-reverse' : 'space-x-1'}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <span className="material-icons text-sm">{isRightToLeft ? 'last_page' : 'first_page'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="material-icons text-sm">{isRightToLeft ? 'chevron_right' : 'chevron_left'}</span>
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = currentPage > 3 && totalPages > 5
                  ? currentPage - 3 + i + 1
                  : i + 1;
                
                return pageNumber <= totalPages ? (
                  <Button
                    key={i}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ) : null;
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="material-icons text-sm">{isRightToLeft ? 'chevron_left' : 'chevron_right'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <span className="material-icons text-sm">{isRightToLeft ? 'first_page' : 'last_page'}</span>
              </Button>
            </div>

            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
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
