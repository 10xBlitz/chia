"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface TreatmentDeleteWarningModalProps {
  open: boolean;
  treatmentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const TreatmentDeleteWarningModal: React.FC<
  TreatmentDeleteWarningModalProps
> = ({ open, treatmentName, onConfirm, onCancel, isDeleting = false }) => {
  return (
    <Dialog open={open} onOpenChange={() => !isDeleting && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            시술 삭제 안내 {/* Treatment Deletion Guide */}
          </DialogTitle>
          <DialogDescription>
            &quot;{treatmentName}&quot; 시술을 삭제하면 아래와 같이 변경됩니다.
            {/* When "{treatmentName}" treatment is deleted, the following changes will occur. */}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Public Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-blue-600">
              일반 사용자에게 보이는 화면 {/* Public User Visible Screens */}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                메인 페이지에서 시술이 더 이상 보이지 않습니다{" "}
                {/* Treatment will no longer be visible on main page */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                시술 소개 페이지에서 더 이상 보이지 않습니다{" "}
                {/* Will no longer be visible on treatment introduction page */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                병원 소개 페이지에서 해당 시술이 완전히 사라집니다{" "}
                {/* Treatment will completely disappear from clinic introduction page */}
              </li>
            </ul>
          </div>

          {/* Patient Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-green-600">
              환자들에게 미치는 영향 {/* Impact on Patients */}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술로 예약한
                환자들의 예약 내역이 보이지 않게 됩니다{" "}
                {/* Patients' reservation history for this treatment will become invisible */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술로 요청한
                견적서가 환자 화면에서 사라집니다{" "}
                {/* Quotation requests for this treatment will disappear from patient screens */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                새로 예약할 때 시술 선택 목록에서 사라집니다{" "}
                {/* Will disappear from treatment selection list when making new reservations */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                견적 요청할 때 시술 선택 목록에서 사라집니다{" "}
                {/* Will disappear from treatment selection list when requesting quotations */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                리뷰 작성할 때 시술 선택 목록에서 사라집니다{" "}
                {/* Will disappear from treatment selection list when writing reviews */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술에 대한 기존
                리뷰들이 병원 페이지에서 보이지 않습니다{" "}
                {/* Existing reviews for this treatment will not be visible on clinic pages */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                환자들이 작성한 이 시술 리뷰가 개인 페이지에서 보이지 않습니다{" "}
                {/* Patient reviews for this treatment will not be visible on personal pages */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                환자의 예약 목록에서 이 시술 예약이 보이지 않습니다{" "}
                {/* This treatment reservation will not be visible in patient's reservation list */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                환자의 견적 목록에서 이 시술 견적이 보이지 않습니다{" "}
                {/* This treatment quotation will not be visible in patient's quotation list */}
              </li>
            </ul>
          </div>

          {/* Admin Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-purple-600">
              관리자 화면에서의 변화 {/* Changes in Admin Screens */}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                시술 관리 목록에서 더 이상 보이지 않습니다{" "}
                {/* Will no longer be visible in treatment management list */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                병원 정보 수정할 때 이 시술이 선택 목록에서 사라집니다{" "}
                {/* This treatment will disappear from selection list when editing clinic information */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술 관련
                예약들이 예약 관리에서 보이지 않습니다{" "}
                {/* Reservations related to this treatment will not be visible in reservation management */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술 관련
                리뷰들이 리뷰 관리에서 보이지 않습니다{" "}
                {/* Reviews related to this treatment will not be visible in review management */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술 관련
                견적들이 견적 관리에서 보이지 않습니다{" "}
                {/* Quotations related to this treatment will not be visible in quotation management */}
              </li>
            </ul>
          </div>

          {/* Dentist Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-orange-600">
              치과의사들에게 미치는 영향 {/* Impact on Dentists */}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                새로 가입하는 치과의사가 이 시술을 선택할 수 없습니다{" "}
                {/* New dentists cannot select this treatment during registration */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                만약 가입 도중 삭제되면 오류 메시지가 나타납니다{" "}
                {/* Error message will appear if deleted during registration process */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술 관련 리뷰가
                치과의사 화면에서 보이지 않습니다{" "}
                {/* Reviews related to this treatment will not be visible on dentist screens */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술 관련 견적이
                치과의사 화면에서 보이지 않습니다{" "}
                {/* Quotations related to this treatment will not be visible on dentist screens */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술 관련 예약이
                치과의사 화면에서 보이지 않습니다{" "}
                {/* Reservations related to this treatment will not be visible on dentist screens */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>이 시술로 입찰한
                견적들이 치과의사 견적 목록에서 보이지 않습니다{" "}
                {/* Quotations with bids for this treatment will not be visible in dentist quotation list */}
              </li>
            </ul>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-800 font-medium text-center">
              ⚠️ 이 작업은 되돌릴 수 없습니다. 신중하게 결정해주세요.
              {/* ⚠️ This action cannot be undone. Please decide carefully. */}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            취소 {/* Cancel */}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "확인 및 삭제"}{" "}
            {/* Deleting... / Confirm and Delete */}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
