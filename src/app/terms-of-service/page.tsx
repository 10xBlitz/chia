"use client";

import HeaderWithBackButton from "@/components/header-with-back-button";
import MobileLayout from "@/components/layout/mobile-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import React, { useState } from "react";

export default function TermsOfServicePage() {
  const [tab, setTab] = useState<"terms" | "payment">("terms");
  return (
    <MobileLayout>
      <HeaderWithBackButton title="이용약관" /> {/* Terms of Service */}
      <div className="p-4">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "terms" | "payment")}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="terms">
              이용약관 {/* Terms of Service */}
            </TabsTrigger>
            <TabsTrigger value="payment">
              결제/환불 안내 {/* Payment/Refund Policy */}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="terms">
            <div className="text-sm leading-relaxed text-gray-700">
              <h1 className="text-xl font-bold mb-4">
                이용약관 (Terms of Service)
              </h1>
              <p className="mb-4">
                본 웹사이트는 치과 진료 예약, 병원 정보 제공, 리뷰 작성 등
                환자와 치과를 연결하는 플랫폼입니다.
                {/* This website is a platform connecting patients and dental clinics for appointments, clinic information, and reviews. */}
                서비스를 이용함으로써 아래의 약관에 동의하게 됩니다.
                {/* By using this service, you agree to the following terms. */}
              </p>
              <h2 className="font-semibold mt-6 mb-2">1. 서비스 목적</h2>{" "}
              {/* 1. Purpose of Service */}
              <p className="mb-4">
                본 플랫폼은 환자와 치과 병원 간의 예약, 상담, 리뷰 등 다양한
                서비스를 제공합니다. 모든 정보는 사용자 편의를 위해 제공되며,
                진료의 최종 책임은 각 치과에 있습니다.
                {/* This platform provides various services such as appointments, consultations, and reviews between patients and dental clinics. All information is for user convenience; final responsibility for treatment lies with each clinic. */}
              </p>
              <h2 className="font-semibold mt-6 mb-2">2. 회원가입 및 계정</h2>{" "}
              {/* 2. Membership and Account */}
              <ul className="list-disc pl-5 mb-4">
                <li>
                  회원은 본인의 정확한 정보를 제공해야 하며, 타인의 정보를
                  도용할 수 없습니다.{" "}
                  {/* Members must provide accurate information and may not use others' information. */}
                </li>
                <li>
                  계정 정보가 변경될 경우 즉시 수정해야 합니다.{" "}
                  {/* Account information must be updated immediately if changed. */}
                </li>
                <li>
                  계정 보안 유지 책임은 회원 본인에게 있습니다.{" "}
                  {/* Members are responsible for maintaining account security. */}
                </li>
              </ul>
              <h2 className="font-semibold mt-6 mb-2">3. 서비스 이용</h2>{" "}
              {/* 3. Service Usage */}
              <ul className="list-disc pl-5 mb-4">
                <li>
                  예약, 리뷰, 상담 등은 본 약관 및 관련 법령을 준수하여 이용해야
                  합니다.{" "}
                  {/* Appointments, reviews, and consultations must comply with these terms and relevant laws. */}
                </li>
                <li>
                  부적절한 내용, 허위 정보, 타인 비방 등은 금지됩니다.{" "}
                  {/* Inappropriate content, false information, and defamation are prohibited. */}
                </li>
                <li>
                  서비스 이용 중 발생하는 문제는 고객센터를 통해 문의할 수
                  있습니다.{" "}
                  {/* Issues during service use can be reported to customer support. */}
                </li>
              </ul>
              <h2 className="font-semibold mt-6 mb-2">4. 개인정보 보호</h2>{" "}
              {/* 4. Privacy Protection */}
              <p className="mb-4">
                본 사이트는 회원의 개인정보를 소중히 여기며, 관련 법령에 따라
                안전하게 관리합니다. 자세한 내용은 개인정보처리방침을
                참고하세요.
                {/* This site values your privacy and manages personal information safely according to laws. See our Privacy Policy for details. */}
              </p>
              <h2 className="font-semibold mt-6 mb-2">5. 책임의 한계</h2>{" "}
              {/* 5. Limitation of Liability */}
              <p className="mb-4">
                본 플랫폼은 정보 제공 및 예약 시스템을 운영하며, 진료 행위 및
                결과에 대한 책임은 각 치과에 있습니다. 회원이 직접 등록한 정보
                및 리뷰에 대한 책임은 작성자 본인에게 있습니다.
                {/* This platform provides information and reservation systems; responsibility for treatment and results lies with each clinic. Users are responsible for their own information and reviews. */}
              </p>
              <h2 className="font-semibold mt-6 mb-2">6. 약관의 변경</h2>{" "}
              {/* 6. Changes to Terms */}
              <p className="mb-4">
                본 약관은 필요 시 변경될 수 있으며, 변경 시 사전 공지합니다.
                변경된 약관은 공지 시점부터 효력이 발생합니다.
                {/* These terms may change as needed; changes will be announced in advance and take effect upon notice. */}
              </p>
              <h2 className="font-semibold mt-6 mb-2">7. 문의</h2>{" "}
              {/* 7. Contact */}
              <p>
                서비스 이용 중 궁금한 점이나 불편 사항은 고객센터 또는 이메일로
                문의해 주세요.
                {/* For questions or issues, contact customer support or email us. */}
              </p>
              <p className="mt-8 text-xs text-gray-400">
                본 약관은 2025년 6월 19일 기준으로 적용됩니다.
              </p>{" "}
              {/* These terms are effective as of June 19, 2025. */}
            </div>
          </TabsContent>
          <TabsContent value="payment">
            <div className="text-sm leading-relaxed text-gray-700">
              <h2 className="text-xl font-bold mb-4">
                결제 및 환불 정책 (Payment & Refund Policy)
              </h2>
              <ul className="list-disc pl-5 mb-4">
                <li>
                  결제 후 7일 이내 사용 이력이 없을 경우 전액 환불 가능합니다.
                  {/* Full refund is available within 7 days of payment if the service has not been used. */}
                </li>
                <li>
                  단, 서비스가 일부라도 제공된 경우에는 환불이 불가합니다.
                  {/* No refund if any part of the service has been provided. */}
                </li>
              </ul>
              <h2 className="font-semibold mt-6 mb-2">서비스 제공 기간</h2>{" "}
              {/* Service Delivery Period */}
              <p className="mb-4">
                서비스제공기간: 결제 시점으로부터 최대 1개월간 서비스 제공
                {/* Service delivery period: Up to 1 month from the time of payment. */}
              </p>
              <p className="mt-8 text-xs text-gray-400">
                본 정책은 2025년 6월 19일 기준으로 적용됩니다.
              </p>{" "}
              {/* This policy is effective as of June 19, 2025. */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
