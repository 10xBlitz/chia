"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileTextIcon } from "lucide-react";
import { QuotationTable } from "./columns";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface CellActionProps {
  data: QuotationTable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [showBidsModal, setShowBidsModal] = useState(false);

  // Fetch bids for this quotation
  const {
    data: bids,
    isLoading: bidsLoading,
    error: bidsError,
  } = useQuery({
    queryKey: ["quotation-bids", data.id],
    queryFn: async () => {
      const { data: bidsData, error } = await supabaseClient
        .from("bid")
        .select(
          `
          *,
          clinic_treatment (
            id,
            clinic (
              clinic_name,
              contact_number
            ),
            treatment (
              treatment_name
            )
          )
        `
        )
        .eq("quotation_id", data.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return bidsData;
    },
    enabled: showBidsModal,
  });

  const handleViewBids = () => {
    setShowBidsModal(true);
  };
  //   const queryClient = useQueryClient();

  //   const deleteMutation = useMutation({
  //     mutationFn: async (id: string) => {
  //       const { error } = await supabaseClient
  //         .from("quotation")
  //         .update({ status: "deleted" })
  //         .eq("id", id);

  //       if (error) throw error;
  //     },
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: ["quotations"] });
  //       toast.success("견적 요청이 삭제되었습니다."); // Quotation request deleted
  //     },
  //     onError: (error) => {
  //       toast.error("삭제 중 오류가 발생했습니다."); // Error occurred while deleting
  //       console.error("Delete error:", error);
  //     },
  //   });

  //   const restoreMutation = useMutation({
  //     mutationFn: async (id: string) => {
  //       const { error } = await supabaseClient
  //         .from("quotation")
  //         .update({ status: "active" })
  //         .eq("id", id);

  //       if (error) throw error;
  //     },
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: ["quotations"] });
  //       toast.success("견적 요청이 복원되었습니다."); // Quotation request restored
  //     },
  //     onError: (error) => {
  //       toast.error("복원 중 오류가 발생했습니다."); // Error occurred while restoring
  //       console.error("Restore error:", error);
  //     },
  //   });

  //   const handleDelete = () => {
  //     if (confirm("정말로 이 견적 요청을 삭제하시겠습니까?")) {
  //       // Are you sure you want to delete this quotation request?
  //       deleteMutation.mutate(data.id);
  //     }
  //   };

  //   const handleRestore = () => {
  //     if (confirm("이 견적 요청을 복원하시겠습니까?")) {
  //       // Do you want to restore this quotation request?
  //       restoreMutation.mutate(data.id);
  //     }
  //   };

  //   const handleView = () => {
  //     // TODO: Implement view details modal or navigation
  //     console.log("View quotation details:", data);
  //     toast.success("상세 보기 기능은 준비 중입니다."); // Detail view feature is in preparation
  //   };

  //   const isDeleted = data.status === "deleted";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">메뉴 열기</span> {/* Open menu */}
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* <DropdownMenuItem onClick={handleView}>
            <EyeIcon className="h-4 w-4 mr-2" />
            상세 보기  View Details 
          </DropdownMenuItem> */}
          <DropdownMenuItem onClick={handleViewBids}>
            <FileTextIcon className="h-4 w-4 mr-2" />
            견적서 보기 ({bids?.length || 0}개) {/* View Bids */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BidsModal
        open={showBidsModal}
        onOpenChange={setShowBidsModal}
        bids={bids}
        bidsLoading={bidsLoading}
        bidsError={bidsError}
        name={data.name}
      />
    </>
  );
};

// Define Bid type for modal (should match Supabase bid table shape)
type Bid = {
  id: string;
  created_at: string;
  status: string;
  expected_price_min: number;
  expected_price_max: number;
  recommend_quick_visit: boolean;
  additional_explanation?: string | null;
  clinic_treatment?: {
    id: string;
    clinic?: {
      clinic_name?: string | null;
      contact_number?: string | null;
    } | null;
    treatment?: {
      treatment_name?: string | null;
    } | null;
  } | null;
};

interface BidsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bids: Bid[] | undefined;
  bidsLoading: boolean;
  bidsError: Error | null;
  name: string;
}

const BidsModal: React.FC<BidsModalProps> = ({
  open,
  onOpenChange,
  bids,
  bidsLoading,
  bidsError,
  name,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          견적서 목록 - {name}님 {/* Bid List */}
        </DialogTitle>
      </DialogHeader>
      <div className="mt-4">
        {bidsLoading && <div className="text-center py-4">로딩 중...</div>}

        {bidsError && (
          <div className="text-red-500 text-center py-4">
            견적서를 불러오는 중 오류가 발생했습니다.
          </div>
        )}

        {bids && bids.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            등록된 견적서가 없습니다. {/* No bids registered */}
          </div>
        )}

        {bids && bids.length > 0 && (
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {bid.clinic_treatment?.clinic?.clinic_name ||
                        "병원명 없음"}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">진료 항목:</span>{" "}
                        {bid.clinic_treatment?.treatment?.treatment_name}
                      </p>
                      <p>
                        <span className="font-medium">연락처:</span>{" "}
                        {bid.clinic_treatment?.clinic?.contact_number}
                      </p>
                      <p>
                        <span className="font-medium">등록일:</span>{" "}
                        {format(
                          new Date(bid.created_at),
                          "yyyy년 M월 d일 HH:mm",
                          { locale: ko }
                        )}
                      </p>
                      <p>
                        <span className="font-medium">상태:</span>
                        <span
                          className={`ml-1 px-2 py-1 rounded text-xs ${
                            bid.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bid.status === "active" ? "활성" : "삭제됨"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-2">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-medium text-blue-800">예상 비용</p>
                        <p className="text-lg font-bold text-blue-900">
                          {bid.expected_price_min.toLocaleString()}원 ~{" "}
                          {bid.expected_price_max.toLocaleString()}원
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">빠른 방문 권장:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            bid.recommend_quick_visit
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {bid.recommend_quick_visit ? "예" : "아니요"}
                        </span>
                      </div>

                      {bid.additional_explanation && (
                        <div className="mt-3">
                          <p className="font-medium">추가 설명:</p>
                          <p className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">
                            {bid.additional_explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

//   {isDeleted ? (
//             <DropdownMenuItem
//               onClick={handleRestore}
//               disabled={restoreMutation.isPending}
//             >
//               <EditIcon className="h-4 w-4 mr-2" />
//               복원 {/* Restore */}
//             </DropdownMenuItem>
//           ) : (
//             <DropdownMenuItem
//               onClick={handleDelete}
//               disabled={deleteMutation.isPending}
//               className="text-red-600"
//             >
//               <Trash2Icon className="h-4 w-4 mr-2" />
//               삭제 {/* Delete */}
//             </DropdownMenuItem>
//           )}
