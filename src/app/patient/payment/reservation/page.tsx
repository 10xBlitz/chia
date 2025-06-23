"use client";

import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  loadTossPayments,
  TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const customerKey = "N84M75LskpueYJ2yKb52m";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const amountParams = searchParams.get("amount")
    ? parseInt(searchParams.get("amount") as string, 10)
    : 50; // 기본 금액 50원

  const orderId = searchParams.get("orderId") || "-xZTsRbXHDRL30IBrjM0t";
  // Get all relevant search params
  const reservationId = searchParams.get("reservation_id") || "";
  const treatmentId = searchParams.get("treatment_id") || "";
  const treatmentName = searchParams.get("treatment_name") || "";
  const clinicId = searchParams.get("clinic_id") || "";
  const clinicName = searchParams.get("clinic_name") || "";
  const totalAmount = searchParams.get("total_amount");

  const [amount] = useState({
    currency: "KRW",
    value: amountParams, // 기본 금액 50원
  });
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState<TossPaymentsWidgets>();

  useEffect(() => {
    async function fetchPaymentWidgets() {
      // ------  결제위젯 초기화 ------
      const tossPayments = await loadTossPayments(clientKey);
      // 회원 결제
      const widgets = tossPayments.widgets({
        customerKey,
      });
      // 비회원 결제
      // const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });

      setWidgets(widgets);
    }

    fetchPaymentWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientKey, customerKey]);

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return;
      }
      // ------ 주문의 결제 금액 설정 ------
      await widgets.setAmount(amount);

      await Promise.all([
        // ------  결제 UI 렌더링 ------
        widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        }),
        // ------  이용약관 UI 렌더링 ------
        widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      setReady(true);
    }

    renderPaymentWidgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  useEffect(() => {
    if (widgets == null) {
      return;
    }

    widgets.setAmount(amount);
  }, [widgets, amount]);

  return (
    <MobileLayout>
      <div className="box_section">
        {/* 결제 UI */}
        <div id="payment-method" />
        {/* 이용약관 UI */}
        <div id="agreement" />
        {/* 쿠폰 체크박스 */}
        {/* 결제 정보 표시 */}
        <div className="mb-4 p-4 rounded-sm bg-gray-50 border text-base grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <Label className="text-right">
            예약 번호: {/* Reservation ID */}
          </Label>
          <span className="font-semibold text-left">{reservationId}</span>
          <Label className="text-right">시술 ID: {/* Treatment ID */}</Label>
          <span className="font-semibold text-left">{treatmentId}</span>
          <Label className="text-right">시술명: {/* Treatment Name */}</Label>
          <span className="font-semibold text-left">{treatmentName}</span>
          <Label className="text-right">병원 ID: {/* Clinic ID */}</Label>
          <span className="font-semibold text-left">{clinicId}</span>
          <Label className="text-right">병원명: {/* Clinic Name */}</Label>
          <span className="font-semibold text-left">{clinicName}</span>
          <Label className="text-right">결제 금액: {/* Total Amount */}</Label>
          <span className="font-semibold text-left">{totalAmount}원</span>
        </div>

        {/* 결제하기 버튼 */}
        {widgets && (
          <Button
            className="w-full"
            disabled={!ready}
            onClick={async () => {
              try {
                // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
                // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
                // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
                await widgets.requestPayment({
                  orderId: orderId,
                  orderName: "토스 티셔츠 외 2건",
                  successUrl:
                    window.location.origin +
                    `/patient/reservation/payment/success?amount=${amount.value}&orderId=${orderId}`,
                  failUrl:
                    window.location.origin +
                    "/patient/reservation/payment/fail",
                  customerEmail: "customer123@gmail.com",
                  customerName: "김토스",
                  customerMobilePhone: "01012341234",
                });
              } catch (error) {
                // 에러 처리하기
                console.error(error);
              }
            }}
          >
            결제하기 {/* Pay Now */}
          </Button>
        )}
      </div>
    </MobileLayout>
  );
}
