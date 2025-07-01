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
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// Role translation function
const translateRole = (role: string): string => {
  const roleTranslations: Record<string, string> = {
    patient: "환자", // Patient
    dentist: "치과의사", // Dentist
    admin: "관리자", // Admin
    "dentist employee": "치과 직원", // Dentist Employee
  };
  return roleTranslations[role] || role;
};

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
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

const textSize = "text-[12px] sm:text-sm";
const filterTextSize = "text-[10px] sm:text-xs";

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  paginatedData,
  sorting,
  onSortingChange,
  isLoading = false,
  isError = false,
  errorMessage,
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

  const [fullName, setFullName] = React.useState(
    searchParam.get("full_name") || ""
  );

  const debouncedFullName = useDebounce(fullName || "", 300);
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

  // Only reset page to 1 if a filter or limit changes
  const updateParam = React.useCallback(
    (key: string, value: string, options?: { resetPage?: boolean }) => {
      const params = new URLSearchParams(searchParam.toString());
      params.set(key, value);
      // Only reset page if explicitly requested (e.g., filter/limit change)
      if (options?.resetPage) {
        params.set("page", "1");
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParam, router]
  );

  // Debounce fullName and update param, resetting page
  React.useEffect(() => {
    const current = searchParam.get("full_name") || "";
    if (debouncedFullName !== current) {
      updateParam("full_name", debouncedFullName, { resetPage: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFullName]);

  const [selectedUser, setSelectedUser] = React.useState<TData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);

  return (
    <div className="relative max-w-[90dvw] mx-auto">
      <div className="flex items-center gap-3 py-4">
        <Input
          placeholder="이름으로 검색" // Search by name
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className={cn(
            "bg-white h-[40] sm:h-[45px] max-w-[300px]",
            filterTextSize
          )}
        />
        <Select
          value={category}
          defaultValue={category}
          onValueChange={(value) => {
            updateParam("category", value, { resetPage: true });
          }}
        >
          <SelectTrigger
            className={cn(
              "min-h-[40] sm:min-h-[45px] bg-white",
              filterTextSize
            )}
          >
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
                " justify-start text-left font-normal h-[40] sm:h-[45px]",
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
      <div className="rounded-md border bg-white w-full overflow-x-auto">
        <Table className={cn("w-full", textSize)}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  const colClass =
                    header.column.columnDef.meta &&
                    typeof header.column.columnDef.meta === "object" &&
                    "className" in header.column.columnDef.meta
                      ? (header.column.columnDef.meta as { className?: string })
                          .className || ""
                      : "";
                  return (
                    <TableHead key={header.id} className={cn(colClass)}>
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
                          // First column - typically ID or avatar
                          <div 
                            className="h-4 w-16 bg-gray-200 rounded animate-pulse"
                            style={{ animationDelay: `${index * 50}ms` }}
                          ></div>
                        ) : colIndex === columns.length - 1 ? (
                          // Last column - typically actions or status
                          <div className="flex space-x-1">
                            <div 
                              className="h-6 w-16 bg-gray-200 rounded animate-pulse"
                              style={{ animationDelay: `${index * 50 + 100}ms` }}
                            ></div>
                          </div>
                        ) : (
                          // Other columns - text content with varying widths for names, emails, roles, etc.
                          <div 
                            className={`h-4 bg-gray-200 rounded animate-pulse ${
                              colIndex === 1 ? 'w-28' : // Name column - wider
                              colIndex === 2 ? 'w-36' : // Email column - widest
                              colIndex === 3 ? 'w-20' : // Role column - medium
                              colIndex % 2 === 0 ? 'w-24' : 'w-32'
                            }`}
                            style={{ animationDelay: `${index * 50 + colIndex * 25}ms` }}
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
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedUser(row.original);
                      setIsPanelOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const colClass =
                        cell.column.columnDef.meta &&
                        typeof cell.column.columnDef.meta === "object" &&
                        "className" in cell.column.columnDef.meta
                          ? (
                              cell.column.columnDef.meta as {
                                className?: string;
                              }
                            ).className || ""
                          : "";
                      return (
                        <TableCell key={cell.id} className={colClass}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
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
          )}
        </Table>
      </div>
      {/* User Info Side Panel */}
      <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="max-w-md w-full">
          <SheetHeader>
            <SheetTitle>유저 정보 {/* User Info */}</SheetTitle>
            <SheetDescription>
              선택한 유저의 모든 정보를 표시합니다.{" "}
              {/* Shows all selected user info */}
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-4 space-y-2  break-all px-5 text-sm">
              {Object.entries(selectedUser).map(([key, value]) => {
                // Korean label map
                const keyLabels: Record<string, string> = {
                  id: "아이디", // ID
                  full_name: "성명", // Full Name
                  email: "이메일", // Email
                  birthdate: "생년월일", // Birthdate
                  gender: "성별", // Gender
                  contact_number: "연락처", // Contact Number
                  residence: "거주지", // Residence
                  work_place: "직장", // Workplace
                  role: "역할", // Role
                  login_status: "로그인 상태", // Login Status
                  clinic_id: "클리닉 ID", // Clinic ID
                  created_at: "생성일", // Created At
                  updated_at: "수정일", // Updated At
                  // Add more mappings as needed
                };
                const label = keyLabels[key] || key; // fallback to key if not mapped
                return (
                  <div key={key} className="flex gap-2 border-b py-1">
                    <span className="font-semibold min-w-[90px] capitalize">
                      {label}
                    </span>
                    <span>
                      {key === "role"
                        ? translateRole(String(value))
                        : key === "created_at" && value
                        ? new Date(String(value)).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : typeof value === "object" && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <p className={cn("font-medium", textSize)}>페이지당 행 수</p>{" "}
          {/* Rows per page */}
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
