import { useState, useEffect } from "react";
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
  
  // Use external state if provided, otherwise use internal state
  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
  const pageSize = externalPageSize !== undefined ? externalPageSize : internalPageSize;

  // Detect new rows and highlight them
  useEffect(() => {
    if (highlightNewRows && data.length > previousDataLength) {
      const newRows = new Set<number>();
      // Highlight the new rows (assuming they are added at the end)
      for (let i = previousDataLength; i < data.length; i++) {
        newRows.add(i);
      }
      setNewRowsSet(newRows);
      
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setNewRowsSet(new Set());
      }, 3000);
      
      setPreviousDataLength(data.length);
      return () => clearTimeout(timer);
    } else {
      setPreviousDataLength(data.length);
    }
  }, [data.length, previousDataLength, highlightNewRows]);

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
    if (externalPageChange) {
      externalPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    if (externalPageSizeChange) {
      externalPageSizeChange(newSize);
      // Reset to first page
      if (externalPageChange) {
        externalPageChange(1);
      }
    } else {
      setInternalPageSize(newSize);
      setInternalCurrentPage(1); // Reset to first page
    }
  };

  // Always use RTL context, ignore dir prop if it conflicts
  const direction = isRTL ? 'rtl' : 'ltr';
  const isRightToLeft = isRTL;
  
  // Calculate the actual row index for pagination
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
                  handlePageChange(1); // Reset to first page
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
            <TableRow className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors duration-200">
              {(isRightToLeft ? [...columns].reverse() : columns).filter(column => !column.hidden).map((column, index) => (
                <TableHead 
                  key={index} 
                  className="h-12 px-4 align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0 font-extrabold text-center relative group"
                >
                  <div className="flex items-center justify-center">
                    {column.header}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-300 group-hover:w-full"></div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Enhanced loading skeleton with staggered animation
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow 
                  key={`skeleton-${rowIndex}`}
                  className="animate-pulse"
                  style={{ animationDelay: `${rowIndex * 100}ms` }}
                >
                  {(isRightToLeft ? [...columns].reverse() : columns).filter(column => !column.hidden).map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`} className="p-4">
                      <div 
                        className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]"
                        style={{ animationDelay: `${colIndex * 50}ms` }}
                      ></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => {
                const absoluteRowIndex = getAbsoluteRowIndex(rowIndex);
                const isNewRow = newRowsSet.has(absoluteRowIndex);
                const isHovered = hoveredRow === rowIndex;
                
                return (
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
                    onMouseEnter={() => setHoveredRow(rowIndex)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`
                      border-b border-gray-100 transition-colors duration-200 ease-in-out
                      ${onRowClick ? "cursor-pointer" : ""}
                      ${isHovered ? "bg-gradient-to-r from-blue-50/70 to-indigo-50/70" : ""}
                      ${isNewRow ? "bg-gradient-to-r from-green-50 to-emerald-50" : ""}
                      ${!isHovered && !isNewRow ? "hover:bg-gray-50/60" : ""}
                    `}
                    style={{
                      animationDelay: animateChanges ? `${rowIndex * 50}ms` : '0ms'
                    }}
                  >
                    {(isRightToLeft ? [...columns].reverse() : columns).filter(column => !column.hidden).map((column, colIndex) => (
                      <TableCell 
                        key={colIndex}
                        className={`
                          p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center font-semibold
                          transition-colors duration-200 ease-in-out
                          ${isHovered ? "bg-gray-50" : ""}
                        `}
                      >
                        {column.cell
                          ? column.cell(row, getAbsoluteRowIndex(rowIndex))
                          : typeof column.accessorKey === "function"
                          ? column.accessorKey(row)
                          : column.accessorKey 
                            ? (row[column.accessorKey as keyof T] as React.ReactNode)
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
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
