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
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
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
}

export function DataTable<TData, TValue>({
  columns,
  paginatedData,
  onClickAdd,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParam = useSearchParams();
  const [sorting, setSorting] = React.useState<SortingState>([]);
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
  const [page, setPage] = React.useState(pageParam);
  const [limit, setLimit] = React.useState(limitParam);

  const [clinicName, setClinicName] = React.useState(
    searchParam.get("clinic_name") || ""
  );
  // const [category, setCategory] = React.useState(
  //   searchParam.get("category") || ""
  // );
  const [dates, setDates] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 5),
  });

  const debouncedClinicName = useDebounce(clinicName || "", 500);
  //-- End search params states

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
        pageSize: limit,
      },
    },
  });

  // Wrap updateParam in useCallback to avoid unnecessary re-creations
  const updateParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParam.toString());

      //update or delete the param
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      //reset pagination when filter or limit changes
      if (key !== "page") {
        params.set("page", "1");
        setPage(1);
        setLimit(10);
      }

      //update local state
      if (key === "page") setPage(Number(value));

      if (key === "limit") setLimit(Number(value));

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParam]
  );

  //debounced the fullName so that it doesn't trigger the search params update on every keystroke
  React.useEffect(() => {
    updateParam("clinic_name", debouncedClinicName);
  }, [debouncedClinicName, updateParam]);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="병원 이름으로 검색" // "Search by clinic name"
            value={clinicName}
            onChange={(event) => setClinicName(event.target.value)}
            className="max-w-sm h-[45px] bg-white"
          />
          {/* <Select
          value={category}
          defaultValue={category}
          onValueChange={(value) => {
            setCategory(value);
            updateParam("category", value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="dentist">Dentist</SelectItem>
              <SelectItem value="dentist_employee">Dentist Employee</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select> */}
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
                  <span>Pick a date</span>
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
                  setDates(dates);
                  updateParam("dates", JSON.stringify(dates));
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          onClick={onClickAdd}
          className="bg-white text-black border-1 hover:bg-black/20"
        >
          <PlusSquareIcon className="h-4 w-4" /> 클리닉 추가 {/**Add Clinic */}
        </Button>
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
                  결과 없음
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            페이지당 행 수 {/**rows per page */}
          </p>
          <Select
            value={`${limit}`}
            onValueChange={(value) => updateParam("limit", value)}
          >
            <SelectTrigger className="h-8 w-[70px] bg-white">
              <SelectValue placeholder={limit} />
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
            {/* Page {table.getState().pagination.pageIndex + 1} of{" "} */}
            {/* {table.getPageCount()} */}
            {page} / {paginatedData.totalPages} 페이지
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
            onClick={() => updateParam("page", (page - 1).toString())}
            disabled={!paginatedData.hasPrevPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => updateParam("page", (page + 1).toString())}
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
