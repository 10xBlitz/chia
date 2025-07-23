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

interface ClinicDeleteWarningModalProps {
  open: boolean;
  clinicName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const ClinicDeleteWarningModal: React.FC<ClinicDeleteWarningModalProps> = ({
  open,
  clinicName,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={() => !isDeleting && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            병원 삭제 안내 {/* Clinic Deletion Guide */}
          </DialogTitle>
          <DialogDescription>
            &quot;{clinicName}&quot; 병원을 삭제하면 아래와 같이 변경됩니다.
            {/* When "{clinicName}" clinic is deleted, the following changes will occur. */}
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
                메인 페이지에서 병원이 더 이상 보이지 않습니다 {/* Clinic will no longer be visible on main page */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                병원 상세보기 페이지에 접속할 수 없습니다 {/* Clinic detail page cannot be accessed */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                시술별 페이지에서 이 병원이 보이지 않습니다 {/* This clinic will not be visible on treatment-specific pages */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                이 병원의 이벤트가 메인 페이지에서 보이지 않습니다 {/* Clinic events will not be visible on main page */}
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
                <span className="text-red-500 mt-1">•</span>
                이 병원으로 예약한 환자들의 예약 내역이 보이지 않게 됩니다 {/* Patients' reservation history for this clinic will become invisible */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                즐겨찾기에 등록된 병원이 목록에서 사라집니다 {/* Favorited clinic will disappear from favorites list */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                이 병원에 요청한 개인 견적서가 환자 화면에서 사라집니다 {/* Private quotation requests to this clinic will disappear from patient screens */}
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
                새로 가입하는 치과의사가 이 병원을 선택할 수 없습니다 {/* New dentists cannot select this clinic during registration */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                만약 가입 도중 삭제되면 오류 메시지가 나타납니다 {/* Error message will appear if deleted during registration process */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                이 병원에 소속된 치과의사들은 로그인할 수 없게 됩니다 {/* Dentists belonging to this clinic will be unable to login */}
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
                병원 관리 목록에서 더 이상 보이지 않습니다 {/* Will no longer be visible in clinic management list */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                이 병원 관련 개인 견적들이 견적 관리에서 보이지 않습니다 {/* Private quotations related to this clinic will not be visible in quotation management */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                이 병원 관련 리뷰들이 리뷰 관리에서 보이지 않습니다 {/* Reviews related to this clinic will not be visible in review management */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                이 병원 관련 이벤트들이 이벤트 관리에서 보이지 않습니다 {/* Events related to this clinic will not be visible in event management */}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                이 병원 소속 치과의사들이 사용자 관리에서 보이지 않습니다 {/* Dentists belonging to this clinic will not be visible in user management */}
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
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            취소 {/* Cancel */}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "확인 및 삭제"} {/* Deleting... / Confirm and Delete */}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};