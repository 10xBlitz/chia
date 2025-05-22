"use client";

import Link from "next/link";
import BottomNavigation from "@/components/bottom-navigation";

export default function MyPage() {
  const menuItems = [
    {
      title: "내 정보",
      items: [
        { label: "내 프로필", url: "/main/mypage/profile" },
        { label: "알림 설정", url: "/main/mypage/notifications" },
      ],
    },
    {
      title: "진료 관리",
      items: [
        { label: "예약 관리", url: "/main/reservations" },
        { label: "진료 기록", url: "/main/mypage/medical-records" },
        { label: "리뷰 관리", url: "/main/mypage/reviews" },
      ],
    },
    {
      title: "고객센터",
      items: [
        { label: "자주 묻는 질문", url: "/main/mypage/faq" },
        { label: "공지사항", url: "/main/mypage/notices" },
        { label: "1:1 문의", url: "/main/mypage/inquiries" },
      ],
    },
    {
      title: "앱 정보",
      items: [
        { label: "이용약관", url: "/main/mypage/terms" },
        { label: "개인정보처리방침", url: "/main/mypage/privacy" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full pb-16">
      {/* User profile section */}
      <div className="p-6 bg-blue-50 flex items-center">
        <div className="w-16 h-16 bg-gray-300 rounded-full mr-4"></div>
        <div>
          <p className="font-bold text-lg">사용자 이름</p>
          <p className="text-sm text-gray-600">example@email.com</p>
        </div>
      </div>

      {/* Menu sections */}
      <div className="flex-1 overflow-auto">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-6 py-2 font-medium text-gray-500">
              {section.title}
            </h3>
            <div className="bg-white">
              {section.items.map((item, itemIdx) => (
                <Link
                  key={itemIdx}
                  href={item.url}
                  className="flex justify-between items-center px-6 py-4 border-b"
                >
                  <span>{item.label}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="p-6">
          <button className="w-full py-3 text-gray-500 text-center">
            로그아웃
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
