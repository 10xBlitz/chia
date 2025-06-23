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
} from "lucide-react";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { addDays, format } from "date-fns";
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
  sorting: SortingState;
  onSortingChange: (
    updater:
      | SortingState
      | ((old: SortingState) => SortingState)
  ) => void;
}

export function DataTable<TData, TValue>({
  columns,
  paginatedData,
  sorting,
  onSortingChange,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParam = useSearchParams();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  //-- Start search params states
  const pageParam = searchParam.get("page")
    ? Number(searchParam.get("page"))
    : 1;
  const limitParam = searchParam.get("limit")
    ? Number(searchParam.get("limit"))
    : 10;
  const category = searchParam.get("category") || "all"; // Default to "all"
  const datesParam = searchParam.get("dates");
  let dates: { from: Date; to: Date } | undefined;
  if (datesParam) {
    const decodedDates = JSON.parse(decodeURIComponent(datesParam));
    dates = {
      from: decodedDates.from ? new Date(decodedDates.from) : new Date(),
      to: decodedDates.to ? new Date(decodedDates.to) : addDays(new Date(), 5),
    };
  } else {
    dates = {
      from: new Date(),
      to: addDays(new Date(), 5),
    };
  }

  const [fullName, setFullName] = React.useState(
    searchParam.get("full_name") || ""
  );

  const debouncedFullName = useDebounce(fullName || "", 500);
  //-- End search params states

  const table = useReactTable({
    data: paginatedData.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange,
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

  // Wrap updateParam in useCallback to prevent it from changing on every render
  const updateParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParam.toString());

      params.set(key, value);

      //reset pagination when filter or limit changes
      if (key !== "page") {
        params.set("page", "1");
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParam, router]
  );

  //debounced the fullName so that it doesn't trigger the search params update on every keystroke
  React.useEffect(() => {
    updateParam("full_name", debouncedFullName);
  }, [debouncedFullName, updateParam]);

  //auto add search params tothe URL
  React.useEffect(() => {
    const params = new URLSearchParams(searchParam.toString());
    params.set("page", String(pageParam));
    params.set("limit", String(limitParam));
    params.set("category", category);
    params.set("full_name", fullName);
    params.set("dates", JSON.stringify(dates));
    router.replace(`?${params.toString()}`, { scroll: false });
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 py-4">
        <Input
          placeholder="이름으로 검색" // Search by name
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-[300px] bg-white h-[45px]"
        />
        <Select
          value={category}
          defaultValue={category}
          onValueChange={(value) => {
            updateParam("category", value);
          }}
        >
          <SelectTrigger className="w-[300px] min-h-[45px] bg-white">
            <SelectValue placeholder="카테고리를 선택하세요" />{" "}
            {/* Select a category */}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">전체</SelectItem> {/* All */}
              <SelectItem value="admin">관리자</SelectItem> {/* Admin */}
              <SelectItem value="patient">환자</SelectItem> {/* Patient */}
              <SelectItem value="dentist">치과의사</SelectItem> {/* Dentist */}
              <SelectItem value="dentist_employee">치과 직원</SelectItem>{" "}
              {/* Dentist Employee */}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dates && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              {dates?.from ? (
                dates.to ? (
                  <>
                    {format(dates.from, "LLL dd, y")} -{" "}
                    {format(dates.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dates.from, "LLL dd, y")
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
                updateParam("dates", JSON.stringify(dates));
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                  결과 없음 {/* No results */}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">페이지당 행 수</p>{" "}
          {/* Rows per page */}
          <Select
            value={`${limitParam}`}
            onValueChange={(value) => updateParam("limit", value)}
          >
            <SelectTrigger className="h-8 w-[70px] bg-white">
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
          <div className="flex items-center justify-center text-sm font-medium">
            {pageParam} / {paginatedData.totalPages} 페이지{" "}
            {/* Page {page} of {paginatedData.totalPages} */}
          </div>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => updateParam("page", "1")}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">첫 페이지로 이동</span>{" "}
            {/* Go to first page */}
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (pageParam - 1).toString())}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">이전 페이지로 이동</span>{" "}
            {/* Go to previous page */}
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (pageParam + 1).toString())}
            disabled={!paginatedData.hasNextPage}
          >
            <span className="sr-only">다음 페이지로 이동</span>{" "}
            {/* Go to next page */}
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
            <span className="sr-only">마지막 페이지로 이동</span>{" "}
            {/* Go to last page */}
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
