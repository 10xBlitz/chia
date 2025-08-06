"use client";

import HeaderWithBackButton from "@/components/header-with-back-button";
import MobileLayout from "@/components/layout/mobile-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TermsOfServicePage() {
  const [tab, setTab] = useState<"terms" | "payment" | "privacy">("terms");
  const [isEnglish, setIsEnglish] = useState(false);
  const searchParams = useSearchParams();

  // Auto-select tab based on URL param (?tab=terms|payment|privacy)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "terms" ||
      tabParam === "payment" ||
      tabParam === "privacy"
    ) {
      setTab(tabParam);
    }
  }, [searchParams]);
  return (
    <MobileLayout>
      <HeaderWithBackButton title={isEnglish ? "Terms of Service" : "이용약관"} />
      <div className="p-4">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setIsEnglish(!isEnglish)}
            className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
          >
            {isEnglish ? "Language: English" : "언어: 한국어"}
          </button>
        </div>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "terms" | "payment" | "privacy")}
          className="w-full"
        >
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="terms">
              {isEnglish ? "Terms of Service" : "이용약관"}
            </TabsTrigger>
            <TabsTrigger value="payment">
              {isEnglish ? "Payment/Refund" : "결제/환불 안내"}
            </TabsTrigger>
            <TabsTrigger value="privacy">
              {isEnglish ? "Privacy Policy" : "개인정보보호"}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="terms">
            <div className="text-sm leading-relaxed text-gray-700">
              <h1 className="text-xl font-bold mb-4">
                {isEnglish ? "Terms of Service" : "이용약관"}
              </h1>
              <p className="mb-4">
                {isEnglish
                  ? "This website is a platform connecting patients and dental clinics for appointments, clinic information, and reviews. By using this service, you agree to the following terms."
                  : "본 웹사이트는 치과 진료 예약, 병원 정보 제공, 리뷰 작성 등 환자와 치과를 연결하는 플랫폼입니다. 서비스를 이용함으로써 아래의 약관에 동의하게 됩니다."}
              </p>
              <h2 className="font-semibold mt-6 mb-2">
                {isEnglish ? "1. Purpose of Service" : "1. 서비스 목적"}
              </h2>
              <p className="mb-4">
                {isEnglish
                  ? "This platform provides various services such as appointments, consultations, and reviews between patients and dental clinics. All information is for user convenience; final responsibility for treatment lies with each clinic."
                  : "본 플랫폼은 환자와 치과 병원 간의 예약, 상담, 리뷰 등 다양한 서비스를 제공합니다. 모든 정보는 사용자 편의를 위해 제공되며, 진료의 최종 책임은 각 치과에 있습니다."}
              </p>
              <h2 className="font-semibold mt-6 mb-2">
                {isEnglish ? "2. Membership and Account" : "2. 회원가입 및 계정"}
              </h2>
              <ul className="list-disc pl-5 mb-4">
                <li>
                  {isEnglish
                    ? "Members must provide accurate information and may not use others' information."
                    : "회원은 본인의 정확한 정보를 제공해야 하며, 타인의 정보를 도용할 수 없습니다."}
                </li>
                <li>
                  {isEnglish
                    ? "Account information must be updated immediately if changed."
                    : "계정 정보가 변경될 경우 즉시 수정해야 합니다."}
                </li>
                <li>
                  {isEnglish
                    ? "Members are responsible for maintaining account security."
                    : "계정 보안 유지 책임은 회원 본인에게 있습니다."}
                </li>
              </ul>
              <h2 className="font-semibold mt-6 mb-2">
                {isEnglish ? "3. Service Usage" : "3. 서비스 이용"}
              </h2>
              <ul className="list-disc pl-5 mb-4">
                <li>
                  {isEnglish
                    ? "Appointments, reviews, and consultations must comply with these terms and relevant laws."
                    : "예약, 리뷰, 상담 등은 본 약관 및 관련 법령을 준수하여 이용해야 합니다."}
                </li>
                <li>
                  {isEnglish
                    ? "Inappropriate content, false information, and defamation are prohibited."
                    : "부적절한 내용, 허위 정보, 타인 비방 등은 금지됩니다."}
                </li>
                <li>
                  {isEnglish
                    ? "Issues during service use can be reported to customer support."
                    : "서비스 이용 중 발생하는 문제는 고객센터를 통해 문의할 수 있습니다."}
                </li>
              </ul>
              <h2 className="font-semibold mt-6 mb-2">
                {isEnglish ? "4. Privacy Protection" : "4. 개인정보 보호"}
              </h2>
              <p className="mb-4">
                {isEnglish
                  ? "This site values your privacy and manages personal information safely according to laws. See our Privacy Policy for details."
                  : "본 사이트는 회원의 개인정보를 소중히 여기며, 관련 법령에 따라 안전하게 관리합니다. 자세한 내용은 개인정보처리방침을 참고하세요."}
              </p>
              <h2 className="font-semibold mt-6 mb-2">
                {isEnglish ? "5. Limitation of Liability" : "5. 책임의 한계"}
              </h2>
              <p className="mb-4">
                {isEnglish
                  ? "This platform provides information and reservation systems; responsibility for treatment and results lies with each clinic. Users are responsible for their own information and reviews."
                  : "본 플랫폼은 정보 제공 및 예약 시스템을 운영하며, 진료 행위 및 결과에 대한 책임은 각 치과에 있습니다. 회원이 직접 등록한 정보 및 리뷰에 대한 책임은 작성자 본인에게 있습니다."}
              </p>
              <h2 className="font-semibold mt-6 mb-2">
                {isEnglish ? "6. Changes to Terms" : "6. 약관의 변경"}
              </h2>
              <p className="mb-4">
                {isEnglish
                  ? "These terms may change as needed; changes will be announced in advance and take effect upon notice."
                  : "본 약관은 필요 시 변경될 수 있으며, 변경 시 사전 공지합니다. 변경된 약관은 공지 시점부터 효력이 발생합니다."}
              </p>
              <h2 className="font-semibold mt-6 mb-2">
                {isEnglish ? "7. Contact" : "7. 문의"}
              </h2>
              <p>
                {isEnglish
                  ? "For questions or issues, contact customer support or email us."
                  : "서비스 이용 중 궁금한 점이나 불편 사항은 고객센터 또는 이메일로 문의해 주세요."}
              </p>
              <p className="mt-8 text-xs text-gray-400">
                {isEnglish
                  ? "These terms are effective as of June 19, 2025."
                  : "본 약관은 2025년 6월 19일 기준으로 적용됩니다."}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="payment">
            <div className="text-sm leading-relaxed text-gray-700">
              <h2 className="text-xl font-bold mb-4">
                {isEnglish ? "Payment & Refund Policy" : "결제 및 환불 정책"}
              </h2>
              <ul className="list-disc pl-5 mb-4">
                <li>
                  {isEnglish
                    ? "Full refund is available within 7 days of payment if the service has not been used."
                    : "결제 후 7일 이내 사용 이력이 없을 경우 전액 환불 가능합니다."}
                </li>
                <li>
                  {isEnglish
                    ? "No refund if any part of the service has been provided."
                    : "단, 서비스가 일부라도 제공된 경우에는 환불이 불가합니다."}
                </li>
              </ul>
              <h2 className="font-semibold mt-6 mb-2">
                {isEnglish ? "Service Delivery Period" : "서비스 제공 기간"}
              </h2>
              <p className="mb-4">
                {isEnglish
                  ? "Service delivery period: Up to 1 month from the time of payment."
                  : "서비스제공기간: 결제 시점으로부터 최대 1개월간 서비스 제공"}
              </p>
              <p className="mt-8 text-xs text-gray-400">
                {isEnglish
                  ? "This policy is effective as of June 19, 2025."
                  : "본 정책은 2025년 6월 19일 기준으로 적용됩니다."}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="privacy">
            <div className="text-sm leading-relaxed text-gray-700">
              <h1 className="text-xl font-bold mb-4">
                {isEnglish ? "Privacy Policy" : "개인정보보호정책"}
              </h1>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                
                {/* App and Developer Information */}
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>{isEnglish ? "App Name:" : "앱 이름:"}</strong> 치아 (Chia)
                  </p>
                  
                  <p>
                    <strong>{isEnglish ? "Company:" : "상호명:"}</strong> 비씨디 (BCD)
                  </p>
                  <p>
                    <strong>{isEnglish ? "CEO:" : "대표자명:"}</strong> 홍준기 (Junki Hong)
                  </p>
                  <p>
                    <strong>{isEnglish ? "Business Registration:" : "사업자등록번호:"}</strong> 235-04-01772
                  </p>
                  <p>
                    <strong>{isEnglish ? "Address:" : "사업장 주소:"}</strong> {isEnglish ? "Gyeonggi-do Hwaseong-si Hyangnam-eup Sangsinhagil-ro 66, 1st Floor Jebi01ho (Dream City)" : "경기도 화성시 향남읍 상신하길로 66, 제지1층 제비01호(드림시티)"}
                  </p>
                  <p>
                    <strong>{isEnglish ? "Phone:" : "유선번호:"}</strong> 010 3757 1495
                  </p>
                  <p>
                    <strong>{isEnglish ? "E-commerce Registration:" : "통신판매업 신고번호:"}</strong> 2025 - 화성향남 0101
                  </p>
                  <br />
                  <h2 className="font-semibold mb-2">{isEnglish ? "App & Developer Information" : "앱 및 개발자 정보"}</h2>
                  <p>
                    <strong>{isEnglish ? "Developer:" : "개발자:"}</strong> 10X Blitz
                  </p>
                  <p>
                    <strong>{isEnglish ? "Developer CEO:" : "개발자 대표:"}</strong> 김요셉 (Joseph Kim)
                  </p>
                  <p>
                    <strong>{isEnglish ? "Developer Email:" : "개발자 이메일:"}</strong> business@10xblitz.com
                  </p>
                  <p>
                    <strong>{isEnglish ? "Developer Contact:" : "개발자 연락처:"}</strong> 01050909006
                  </p>
                  {/* App Name: Chia / Developer: 10X Blitz / Developer CEO: Joseph Kim / Developer Email: business@10xblitz.com / Developer Contact: 01050909006 / Company: BCD / CEO: Junki Hong / Business Registration: 235-04-01772 / Address: Gyeonggi-do Hwaseong-si / Phone: 010 3757 1495 / E-commerce Registration: 2025 - 화성향남 0101 */}
                </div>
              </div>
              <h2 className="font-semibold mt-6 mb-3">
                {isEnglish ? "Article 1. Purpose of Personal Information Processing" : "제 1조. 개인정보의 처리 목적"}
              </h2>
              <p className="mb-4">
                {isEnglish
                  ? "Chia app and BCD process personal information for the following purposes. Personal information being processed will not be used for purposes other than the following, and if the purpose of use changes, necessary measures will be taken, such as obtaining separate consent in accordance with Article 18 of the Personal Information Protection Act."
                  : "①치아(Chia) 앱 및 비씨디(BCD)는 개인정보를 다음의 목적을 위해 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다."}
              </p>
              <h2 className="font-semibold mt-6 mb-3">
                {isEnglish ? "Article 2. Personal Information Processing and Retention Period" : "제 2조. 개인정보의 처리 및 보유 기간"}
              </h2>
              <p className="mb-2">
                {isEnglish
                  ? "Chia app and BCD process and retain personal information within the personal information retention and use period prescribed by law or consented to when collecting personal information from data subjects."
                  : "치아(Chia) 앱 및 비씨디(BCD)는 법령에 따른 개인정보 보유․이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유․이용기간 내에서 개인정보를 처리․보유합니다."}
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>
                  {isEnglish
                    ? "a. Retention Basis: Consent of data subject"
                    : "가. 보유근거 : 정보주체의 동의"}
                </li>
                <li>
                  {isEnglish
                    ? "b. Processing Purpose: Chia app membership registration and management"
                    : "나. 처리목적 : 치아(Chia) 앱 회원가입 및 관리"}
                </li>
                <li>
                  {isEnglish
                    ? "c. Retention Period: 5 years until membership withdrawal (re-consent every 5 years)"
                    : "다. 보유기간 : 회원탈퇴시까지 5년(5년주기 재동의)"}
                </li>
              </ul>
              <h2 className="font-semibold mt-6 mb-3">
                {isEnglish ? "Article 3. Outsourcing of Personal Information Processing" : "제 3조. 개인정보처리의 위탁"}
              </h2>
              <p className="mb-4">
                {isEnglish
                  ? "① Chia app and BCD do not outsource personal information processing tasks for smooth personal information business processing."
                  : "① 치아(Chia) 앱 및 비씨디(BCD)는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하지 않습니다."}
              </p>
              <h2 className="font-semibold mt-6 mb-3">
                {isEnglish ? "Article 4. Items of Personal Information Processed" : "제 4조. 처리하는 개인정보의 항목"}
              </h2>
              <p className="mb-2">
                {isEnglish
                  ? "Chia app and BCD process the following personal information items."
                  : "치아(Chia) 앱 및 비씨디(BCD)는 다음의 개인정보 항목을 처리하고 있습니다."}
              </p>
              <div className="mb-4">
                <p className="font-medium mb-2">
                  {isEnglish ? "a. Chia Member Information" : "가. 치아 회원정보"}
                </p>
                <div className="pl-4">
                  <p className="mb-1">
                    {isEnglish ? "- Required Collection Items" : "- 필수 수집 항목"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "· Chia app registration: name, login ID, email, contact"
                      : "· 치아(Chia) 앱 가입 : 이름, 로그인ID, 이메일, 연락처"}
                  </p>
                  <p className="mb-1 mt-2">
                    {isEnglish ? "- Optional Collection Items" : "- 선택 수집 항목"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "· No optional items collected"
                      : "· 선택항목 수집하지 않음"}
                  </p>
                </div>
              </div>
              <h2 className="font-semibold mt-6 mb-3">
                {isEnglish ? "Article 5. Destruction of Personal Information" : "제 5조. 개인정보의 파기"}
              </h2>
              <p className="mb-3">
                {isEnglish
                  ? "① Chia app and BCD destroy personal information without delay when it becomes unnecessary due to expiration of retention period or achievement of processing purpose. However, it may not be destroyed if extended for consenters according to Article 2 or if preservation is required by other laws."
                  : "① 치아(Chia) 앱 및 비씨디(BCD)는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다. 다만, 본 방침 제2조 내용에 따라 동의자에 한해 연장되거나 다른 법령에 따라 보존이 필요한 경우 파기되지 않을 수 있습니다."}
              </p>
              <p className="mb-2">
                {isEnglish
                  ? "② The procedures and methods for destroying personal information are as follows."
                  : "② 개인정보 파기의 절차 및 방법은 다음과 같습니다."}
              </p>
              <div className="mb-4">
                <p className="font-medium mb-2">
                  {isEnglish ? "a. Destruction Procedure" : "가. 파기절차"}
                </p>
                <p className="mb-2 pl-4">
                  {isEnglish
                    ? "Chia app and BCD process unnecessary personal information and personal information files as follows according to internal policy procedures under the responsibility of the personal information manager."
                    : "치아(Chia) 앱 및 비씨디(BCD)는 불필요한 개인정보 및 개인정보파일은 개인정보책임자의 책임하에 내부방침 절차에 따라 다음과 같이 처리하고 있습니다."}
                </p>
                <div className="pl-4">
                  <p className="mb-1">
                    {isEnglish ? "- Destruction of Personal Information" : "- 개인정보의 파기"}
                  </p>
                  <p className="pl-4 mb-2">
                    {isEnglish
                      ? "· Personal information whose retention period has expired is destroyed without delay from the end date."
                      : "· 보유기간이 경과한 개인정보는 종료일로부터 지체 없이 파기합니다."}
                  </p>
                  <p className="mb-1">
                    {isEnglish ? "- Destruction of Personal Information Files" : "- 개인정보파일의 파기"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "· When personal information files become unnecessary due to achievement of processing purpose, service termination, or business closure, they are destroyed without delay from the date when processing is deemed unnecessary."
                      : "· 개인정보파일의 처리 목적 달성, 해당 서비스의 폐지, 사업의 종료 등 그 개인정보파일이 불필요하게 되었을 때에는 개인정보의 처리가 불필요한 것으로 인정되는 날로부터 지체 없이 그 개인정보파일을 파기합니다."}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <p className="font-medium mb-2">
                  {isEnglish ? "b. Destruction Method" : "나. 파기방법"}
                </p>
                <ul className="list-disc pl-8">
                  <li>
                    {isEnglish
                      ? "Electronic information uses technical methods that cannot reproduce records."
                      : "전자적 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다."}
                  </li>
                  <li>
                    {isEnglish
                      ? "Personal information printed on paper is destroyed by shredding or incineration."
                      : "종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다."}
                  </li>
                </ul>
              </div>
              <h2 className="font-semibold mt-6 mb-3">
                {isEnglish ? "Article 6. Measures to Ensure Security of Personal Information" : "제 6조. 개인정보의 안전성 확보 조치"}
              </h2>
              <p className="mb-3">
                {isEnglish
                  ? "Chia app and BCD take the following measures to ensure security in accordance with Article 29 of the Personal Information Protection Act."
                  : "치아(Chia) 앱 및 비씨디(BCD)는 「개인정보 보호법 제29조」에 따라 다음과 같이 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다."}
              </p>
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">
                    {isEnglish ? "① Establishment and Implementation of Internal Management Plan" : "①내부관리계획의 수립 및 시행"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "Internal management plans are established and implemented in compliance with the Ministry of the Interior and Safety's internal management plan."
                      : "내부관리계획 수립 및 시행은 행정안전부 내부관리계획을 준수하여 시행합니다."}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">
                    {isEnglish ? "② Access Restriction to Personal Information" : "②개인정보에 대한 접근 제한"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "Necessary measures are taken for access control to personal information through granting, changing, and deleting access rights to database systems that process personal information, and unauthorized access from outside is controlled using intrusion prevention systems."
                      : "개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있으며 침입차단시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있습니다."}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">
                    {isEnglish ? "③ Encryption of Personal Information" : "③개인정보의 암호화"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "Users' personal information is encrypted and stored and managed. In addition, separate security functions are used, such as encrypting important data during storage and transmission."
                      : "이용자의 개인정보는 암호화 되어 저장 및 관리되고 있습니다. 또한 중요한 데이터는 저장 및 전송 시 암호화하여 사용하는 등의 별도 보안기능을 사용하고 있습니다."}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">
                    {isEnglish ? "④ Minimization and Training of Personal Information Handling Staff" : "④개인정보 취급 직원의 최소화 및 교육"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "Records of access to personal information processing systems (web logs, summary information, etc.) are stored and managed for more than one year, and for personal information processing systems that process personal information for more than 50,000 data subjects or process unique identification information or sensitive information, they are stored and managed for more than two years. Security functions are used to prevent forgery, theft, and loss of access records to personal information processing systems."
                      : "개인정보처리시스템에 접속한 기록(웹 로그, 요약정보 등)을 1년 이상 보관, 관리하고 있으며, 5만명 이상의 정보 주체에 관하여 개인정보를 처리하거나, 고유식별정보 또는 민감정보를 처리하는 개인정보처리 시스템의 경우에는 2년 이상 보관, 관리하고 있습니다. 개인정보처리시스템에 접속한 기록은 위변조 및 도난, 분실되지 않도록 보안 기능을 사용하고 있습니다."}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">
                    {isEnglish ? "⑤ Minimization and Training of Personal Information Handling Personnel" : "⑤개인정보 취급 담당자의 최소화 및 교육"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "Measures are implemented to manage personal information by designating and minimizing personnel who handle personal information."
                      : "개인정보를 취급하는 담당자를 지정하고 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다."}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">
                    {isEnglish ? "⑥ Technical Measures Against Hacking" : "⑥해킹 등에 대비한 기술적 대책"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "Security programs are installed and regularly updated and inspected to prevent personal information leakage and damage by hacking or computer viruses, and systems are installed in areas with controlled access from outside and are technically/physically monitored and blocked."
                      : "해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다."}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">
                    {isEnglish ? "⑦ Access Control for Unauthorized Personnel" : "⑦비인가자에 대한 출입통제"}
                  </p>
                  <p className="pl-4">
                    {isEnglish
                      ? "A separate physical storage location for personal information systems storing personal information is established and access control procedures are established and operated."
                      : "개인정보를 보관하고 있는 개인정보시스템의 물리적 보관장소를 별도로 두고 이에 대해 출입통제 절차를 수립, 운영하고 있습니다."}
                  </p>
                </div>
              </div>
              <p className="mt-8 text-xs text-gray-400">
                {isEnglish
                  ? "This policy is effective as of July 15, 2025."
                  : "본 정책은 2025년 7월 15일 기준으로 적용됩니다."}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
