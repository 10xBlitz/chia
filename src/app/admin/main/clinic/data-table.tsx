"use client";

import {
  ColumnDef,
  SortingState,
  getSortedRowModel,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

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
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PlusSquareIcon,
} from "lucide-react";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  paginatedData: {
    data: TData[];
    totalItems: number | null;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onClickAdd: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

const textSize = "text-[12px] sm:text-sm";
const filterTextSize = "text-[10px] sm:text-xs";

export function DataTable<TData, TValue>({
  columns,
  paginatedData,
  onClickAdd,
  isLoading = false,
  isError = false,
  errorMessage,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParam = useSearchParams();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // Use search params for pagination and filters
  const pageParam = searchParam.get("page")
    ? Number(searchParam.get("page"))
    : 1;
  const limitParam = searchParam.get("limit")
    ? Number(searchParam.get("limit"))
    : 10;
  const [clinicName, setClinicName] = React.useState(
    searchParam.get("clinic_name") || ""
  );
  const datesParam = searchParam.get("dates");
  let dates: { from: Date; to: Date } | undefined;
  if (datesParam) {
    const decodedDates = JSON.parse(decodeURIComponent(datesParam));
    if (decodedDates.from && decodedDates.to) {
      dates = {
        from: new Date(decodedDates.from),
        to: new Date(decodedDates.to),
      };
    } else {
      dates = undefined;
    }
  } else {
    dates = undefined;
  }

  const debouncedClinicName = useDebounce(clinicName || "", 300);

  const table = useReactTable({
    data: paginatedData.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: 0,
        pageSize: limitParam,
      },
    },
  });

  // Only reset page to 1 if a filter or limit changes
  const updateParam = React.useCallback(
    (key: string, value: string, options?: { resetPage?: boolean }) => {
      const params = new URLSearchParams(searchParam.toString());
      params.set(key, value);
      if (options?.resetPage) {
        params.set("page", "1");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParam, router]
  );

  // Debounce clinicName and update param, resetting page
  React.useEffect(() => {
    const current = searchParam.get("clinic_name") || "";
    if (debouncedClinicName !== current) {
      updateParam("clinic_name", debouncedClinicName, { resetPage: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedClinicName]);

  return (
    <div className="max-w-[90dvw] mx-auto">
      <div className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="병원 이름으로 검색" // "Search by clinic name"
            value={clinicName}
            onChange={(event) => setClinicName(event.target.value)}
            className={cn(
              "max-w-[300px] bg-white h-[40] sm:h-[45px]",
              filterTextSize
            )}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal h-[40] sm:h-[45px]",
                  !dates && "text-muted-foreground",
                  filterTextSize
                )}
              >
                <CalendarIcon />
                {dates?.from ? (
                  dates.to ? (
                    <>
                      {format(dates.from, "yyyy년 M월 d일", { locale: ko })} -{" "}
                      {format(dates.to, "yyyy년 M월 d일", { locale: ko })}
                    </>
                  ) : (
                    format(dates.from, "yyyy년 M월 d일", { locale: ko })
                  )
                ) : (
                  <span>날짜 선택</span> // Pick a date
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dates?.from}
                selected={dates}
                locale={ko}
                onSelect={(dates) => {
                  updateParam("dates", JSON.stringify(dates), {
                    resetPage: true,
                  });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          onClick={onClickAdd}
          className={cn(
            "bg-white text-black h-[40] sm:h-[45px] border-1 hover:bg-black/20",
            filterTextSize
          )}
        >
          <PlusSquareIcon className="size-3 sm:size-4" />{" "}
          <span className="hidden sm:inline">병원 추가</span>
          {/**Add Clinic */}
        </Button>
      </div>
      <div className="rounded-md border bg-white w-full overflow-x-auto">
        <Table className={cn("w-full", textSize)}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          {isError ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  {errorMessage || "오류 발생"} {/* An error occurred */}
                </TableCell>
              </TableRow>
            </TableBody>
          ) : null}
          {isLoading ? (
            <TableBody>
              {Array.from({ length: limitParam }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="h-12">
                      <div className="flex items-center space-x-2">
                        {colIndex === 0 ? (
                          // First column - typically ID or image
                          <div
                            className="h-4 w-16 bg-gray-200 rounded animate-pulse"
                            style={{ animationDelay: `${index * 50}ms` }}
                          ></div>
                        ) : colIndex === columns.length - 1 ? (
                          // Last column - typically actions
                          <div className="flex space-x-1">
                            <div
                              className="h-6 w-6 bg-gray-200 rounded animate-pulse"
                              style={{
                                animationDelay: `${index * 50 + 100}ms`,
                              }}
                            ></div>
                            <div
                              className="h-6 w-6 bg-gray-200 rounded animate-pulse"
                              style={{
                                animationDelay: `${index * 50 + 150}ms`,
                              }}
                            ></div>
                            <div
                              className="h-6 w-6 bg-gray-200 rounded animate-pulse"
                              style={{
                                animationDelay: `${index * 50 + 200}ms`,
                              }}
                            ></div>
                          </div>
                        ) : (
                          // Other columns - text content with varying widths
                          <div
                            className={`h-4 bg-gray-200 rounded animate-pulse ${
                              colIndex % 3 === 0
                                ? "w-24"
                                : colIndex % 3 === 1
                                ? "w-32"
                                : "w-20"
                            }`}
                            style={{
                              animationDelay: `${index * 50 + colIndex * 25}ms`,
                            }}
                          ></div>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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
                    결과 없음
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <p className={cn("font-medium", textSize)}>
            페이지당 행 수 {/**rows per page */}
          </p>
          <Select
            value={`${limitParam}`}
            onValueChange={(value) =>
              updateParam("limit", value, { resetPage: true })
            }
          >
            <SelectTrigger className={cn("h-8 w-[70px] bg-white", textSize)}>
              <SelectValue placeholder={limitParam} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "flex items-center justify-center font-medium",
              textSize
            )}
          >
            {pageParam} / {paginatedData.totalPages} 페이지
          </div>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => updateParam("page", "1")}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (pageParam - 1).toString())}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (pageParam + 1).toString())}
            disabled={!paginatedData.hasNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() =>
              updateParam("page", paginatedData.totalPages.toString())
            }
            disabled={!paginatedData.hasNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
