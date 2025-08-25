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
    ? parseFloat(searchParams.get("amount") as string)
    : 50; // 기본 금액 50원

  const orderId = searchParams.get("orderId") || "-xZTsRbXHDRL30IBrjM0t";
  const eventName = searchParams.get("eventName") || "";
  const treatmentName = searchParams.get("treatmentName") || "";
  const treatmentOriginalPrice =
    searchParams.get("treatmentOriginalPrice") || "";
  const [amount] = useState({
    currency: "KRW",
    value: amountParams ? amountParams : 50, // This is only sample amount
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
        <div>
          {/* 결제 정보 표시 */}
          <div className="mb-4 p-4 rounded-sm bg-gray-50 border text-base grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <Label className="text-right">주문 번호 {/* Order ID */}</Label>
            <span className="font-semibold text-left">{orderId}</span>
            <Label className="text-right">이벤트가 {/* Event Price */}</Label>
            <span className="font-semibold text-left">{amount.value.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}원</span>
            <Label className="text-right">이벤트명 {/* Event Name */}</Label>
            <span className="font-semibold text-left">{eventName}</span>
            <Label className="text-right">시술명 {/* Treatment Name */}</Label>
            <span className="font-semibold text-left">{treatmentName}</span>
            <Label className="text-right">
              시술 원가 {/* Treatment Original Price */}
            </Label>
            <span className="font-semibold text-left">
              {parseFloat(treatmentOriginalPrice).toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}원
            </span>
          </div>
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
            결제하기
          </Button>
        )}
      </div>
    </MobileLayout>
  );
}
