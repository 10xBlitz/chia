"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { format } from "date-fns";
import { calculateAge } from "@/lib/utils";
import { Tables } from "@/lib/supabase/types";

interface ReservationWithUser extends Tables<"reservation"> {
  user: {
    full_name: string;
    contact_number: string;
    birthdate: string;
  };
  clinic_treatment?: {
    treatment?: {
      treatment_name?: string;
    };
  };
  notes?: string;
}

interface ReservationDetailModalProps {
  open: boolean;
  onClose: () => void;
  reservation: ReservationWithUser | null;
  onConfirm?: (reservation: ReservationWithUser) => void;
}

export function ReservationDetailModal({
  open,
  onClose,
  reservation,
  onConfirm,
}: ReservationDetailModalProps) {
  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            예약 상세 정보 {/* Reservation Details */}
          </DialogTitle>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">환자명</p>
              <p className="text-base">{reservation.user.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">나이</p>
              <p className="text-base">{calculateAge(new Date(reservation.user.birthdate))}세</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">연락처</p>
            <p className="text-base">{reservation.user.contact_number}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">예약 날짜</p>
              <p className="text-base">{format(new Date(reservation.reservation_date), "yyyy년 MM월 dd일")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">예약 시간</p>
              <p className="text-base">{format(new Date(`${reservation.reservation_date}T${reservation.reservation_time}`), "HH:mm")}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">치료 항목</p>
            <p className="text-base">{reservation.clinic_treatment?.treatment?.treatment_name || "정보 없음"}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">예약 상태</p>
            <p className="text-base">
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                reservation.status === "accepted" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {reservation.status === "accepted" ? "확정됨" : "대기중"}
              </span>
            </p>
          </div>
          
          {reservation.notes && (
            <div>
              <p className="text-sm font-medium text-gray-500">메모</p>
              <p className="text-base">{reservation.notes}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          {reservation.status !== "accepted" && onConfirm && (
            <Button 
              onClick={() => {
                onConfirm(reservation);
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              예약 확정
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
