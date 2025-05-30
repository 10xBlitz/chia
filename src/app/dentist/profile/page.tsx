"use client";

import HeaderWithBackButton from "@/components/header-with-back-button";
import { format } from "date-fns";
import Link from "next/link";
import { useUserStore } from "@/providers/user-store-provider";

// Reusable row component
function InfoRow({
  label,
  value,
  link,
  highlightWhenEmpty = false,
  emptyText,
}: {
  label: string;
  value?: string;
  editable?: boolean;
  link?: string;
  highlightWhenEmpty?: boolean;
  emptyText?: string;
}) {
  const displayValue =
    value && value.trim().length > 0 ? value : emptyText ? emptyText : "-";
  const textColor =
    value && value.trim().length > 0
      ? "text-black"
      : highlightWhenEmpty
      ? "text-blue-600"
      : "text-gray-400";
  const content = (
    <span className={`text-base font-medium ml-2 ${textColor}`}>
      {displayValue}
    </span>
  );
  return (
    <div className="flex items-center py-4">
      <span className="text-sm text-gray-500 min-w-[72px]">{label}</span>
      {link ? <Link href={link}>{content}</Link> : content}
    </div>
  );
}

// Section title
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-semibold text-black mt-6 mb-2">{children}</div>
  );
}

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  console.log("User data:", user);
  //   Dentist-specific fields
  const dentistName = user?.clinic?.clinic_name || "일신치과의원";
  const establishedAt = user?.clinic?.created_at
    ? format(new Date(user.clinic.created_at), "yyyy.MM.dd")
    : "0000.00.00";
  const clinicContact = user?.clinic?.contact_number || "02-123-1234";
  const clinicAddress = user?.clinic?.location;

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="프로필" />
      <main className="flex-1 flex flex-col mt-2">
        {/* Basic Info */}
        <SectionTitle>기본 정보</SectionTitle>
        <InfoRow label="이름" value={user?.full_name || "김00"} />
        <InfoRow
          label="생년월일"
          value={
            user?.birthdate
              ? format(new Date(user.birthdate), "yyyy.MM.dd")
              : "1996.03.18"
          }
        />
        <InfoRow
          label="연락처"
          value={user?.contact_number || "010-1234-4567"}
        />
        <InfoRow
          label="주소"
          value={user?.residence}
          highlightWhenEmpty
          emptyText="주소지 등록"
          link={user?.residence ? undefined : "#"}
        />

        {/* Divider */}
        <div className="border-t my-4" />

        {/* Clinic Info */}
        <SectionTitle>병원 정보</SectionTitle>
        <InfoRow label="병원명" value={dentistName} />
        <InfoRow label="개설일" value={establishedAt} />
        <InfoRow label="연락처" value={clinicContact} />
        <InfoRow
          label="소재지"
          value={clinicAddress}
          highlightWhenEmpty
          emptyText="소재지 등록"
          link={clinicAddress ? undefined : "#"}
        />
      </main>
    </div>
  );
}
