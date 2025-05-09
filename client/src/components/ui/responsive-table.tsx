import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ArrowRight } from "lucide-react";

interface ResponsiveTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey?: keyof T | ((row: T) => React.ReactNode);
    cell?: (row: T, index?: number) => React.ReactNode;
    meta?: {
      className?: string;
      isTitle?: boolean;
      isAction?: boolean;
      hideOnMobile?: boolean;
    };
    id?: string;
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
  emptyMessage?: string;
  getRowUrl?: (row: T) => string;
}

export function ResponsiveTable<T>({
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
  emptyMessage = "No data available",
  getRowUrl,
}: ResponsiveTableProps<T>) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(DEFAULT_PAGE_SIZE);
  
  // Use external state if provided, otherwise use internal state
  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
  const pageSize = externalPageSize !== undefined ? externalPageSize : internalPageSize;

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

  // Use the dir prop or fallback to isRTL from context
  const direction = dir || (isRTL ? 'rtl' : 'ltr');
  const isRightToLeft = direction === 'rtl';
  
  // Function to get the title column of a row
  const getTitleColumn = (row: T) => {
    const titleColumn = columns.find(col => col.meta?.isTitle);
    if (titleColumn) {
      return titleColumn.cell 
        ? titleColumn.cell(row) 
        : titleColumn.accessorKey && typeof titleColumn.accessorKey !== 'function'
          ? String(row[titleColumn.accessorKey as keyof T])
          : null;
    }
    return null;
  };

  // Function to get an action column
  const getActionColumn = (row: T) => {
    const actionColumn = columns.find(col => col.meta?.isAction);
    if (actionColumn && actionColumn.cell) {
      return actionColumn.cell(row);
    }
    return null;
  };

  // Mobile view renderer - Card-based layout
  const renderMobileView = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="animate-pulse">
              <CardHeader className="p-3 pb-2">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (paginatedData.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500">
          <p>{String(emptyMessage)}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {paginatedData.map((row, index) => {
          const titleValue = getTitleColumn(row);
          const actionElement = getActionColumn(row);
          const url = getRowUrl ? getRowUrl(row) : undefined;
          
          const CardWrapper = ({ children }: { children: React.ReactNode }) => {
            if (url) {
              return (
                <a href={url} className="block no-underline text-inherit">
                  {children}
                </a>
              );
            } else if (onRowClick) {
              return (
                <div onClick={() => onRowClick(row)} className="cursor-pointer">
                  {children}
                </div>
              );
            } else {
              return <>{children}</>;
            }
          };
          
          return (
            <Card key={index} className="overflow-hidden hover:shadow-md transition-all duration-200">
              <CardWrapper>
                <CardHeader className="p-3 pb-2 flex flex-row justify-between items-start space-y-0">
                  <div>
                    {titleValue && (
                      <CardTitle className="text-sm font-semibold">
                        {titleValue}
                      </CardTitle>
                    )}
                  </div>
                  {/* Display a badge or status if appropriate */}
                  {columns.some(col => col.header.toLowerCase().includes('status')) && 
                    columns.map((col, idx) => {
                      if (col.header.toLowerCase().includes('status') && col.cell) {
                        return <div key={idx}>{col.cell(row)}</div>;
                      }
                      return null;
                    })
                  }
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <div className="space-y-2">
                    {columns
                      .filter(col => !col.meta?.hideOnMobile && !col.meta?.isTitle && !col.meta?.isAction)
                      .map((col, colIndex) => {
                        // Handle cell rendering differently to avoid type issues
                        let renderedContent: React.ReactNode;
                        
                        if (col.cell) {
                          renderedContent = col.cell(row);
                        } else if (col.accessorKey && typeof col.accessorKey !== 'function') {
                          const value = row[col.accessorKey as keyof T];
                          if (value !== undefined && value !== null) {
                            renderedContent = typeof value === 'object' ? JSON.stringify(value) : String(value);
                          } else {
                            return null; // Skip rendering if no content
                          }
                        } else {
                          return null; // Skip rendering if no way to get content
                        }
                        
                        return (
                          <div key={colIndex} className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{col.header}:</span>
                            <span className="font-medium">{renderedContent}</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
                {(actionElement || (url && onRowClick)) && (
                  <CardFooter className="p-2 pt-0 flex justify-end border-t border-gray-100">
                    {actionElement || (
                      <span className="text-primary-500 text-xs flex items-center">
                        {t("common.view_details")}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </span>
                    )}
                  </CardFooter>
                )}
              </CardWrapper>
            </Card>
          );
        })}
      </div>
    );
  };

  // Desktop view is handled by the parent component

  return (
    <div className={`space-y-4 ${isRightToLeft ? 'rtl' : 'ltr'}`} dir={direction}>
      {(searchable || actions) && (
        <div className={`flex items-center justify-between ${isRightToLeft ? 'flex-row-reverse' : ''}`}>
          {searchable && (
            <div className="relative max-w-xs">
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handlePageChange(1); // Reset to first page
                }}
                className={`${isRightToLeft ? "pr-10 text-right" : "pl-10"} h-10 text-sm touch-manipulation`}
              />
              <div className={`absolute ${isRightToLeft ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                <Search className="h-4 w-4" />
              </div>
            </div>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}

      {isMobile ? renderMobileView() : null /* Desktop table is rendered by parent */}

      {pagination && totalPages > 0 && isMobile && (
        <div className={`flex items-center justify-between pt-2 ${isRightToLeft ? 'flex-row-reverse' : ''}`}>
          <div className={`text-xs text-gray-500 ${isRightToLeft ? 'text-right' : ''}`}>
            {t("pagination.page_of", { current: currentPage, total: totalPages })}
          </div>
          <div className={`flex items-center ${isRightToLeft ? 'space-x-reverse space-x-2 flex-row-reverse' : 'space-x-2'}`}>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full touch-manipulation"
              onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
              disabled={currentPage === 1}
            >
              {isRightToLeft ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full touch-manipulation"
              onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
              disabled={currentPage === totalPages}
            >
              {isRightToLeft ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}