"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: "홈", //Home
      path: "/patient/home",
      icon: (isActive: boolean) => (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 16V6.55425C17 6.20946 16.8224 5.88899 16.53 5.70625L9.53 1.33125C9.20573 1.12858 8.79427 1.12858 8.47 1.33125L1.47 5.70625C1.17762 5.88899 1 6.20946 1 6.55425V16C1 16.5523 1.44771 17 2 17H12H16C16.5523 17 17 16.5523 17 16Z"
            fill={isActive ? "#4285F4" : "#ACACAC"}
            stroke={isActive ? "#4285F4" : "#ACACAC"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "견적", //Estimate
      path: "/patient/quotation",
      icon: (isActive: boolean) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8"
            fill={isActive ? "#4285F4" : "#ACACAC"}
            stroke={isActive ? "#4285F4" : "#ACACAC"}
          />
          <path
            d="M15 2H9C8.44772 2 8 2.35817 8 2.8V4.4C8 4.84183 8.44772 5.2 9 5.2H15C15.5523 5.2 16 4.84183 16 4.4V2.8C16 2.35817 15.5523 2 15 2Z"
            stroke={isActive ? "#4285F4" : "#ACACAC"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "예약", //Reservation
      path: "/patient/reservation",
      icon: (isActive: boolean) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.791 2V5.79147"
            stroke={isActive ? "#4285F4" : "#ACACAC"}
            strokeWidth="1.89573"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.20898 2V5.79147"
            stroke={isActive ? "#4285F4" : "#ACACAC"}
            strokeWidth="1.89573"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21.0986 19.9781C21.0985 21.0948 20.1938 21.9996 19.0771 21.9996H4.92285C3.80617 21.9996 2.90052 21.0948 2.90039 19.9781V10.3414H21.0986V19.9781ZM21.0996 10.3414H21.0986V8.82483H21.0996V10.3414ZM19.0771 3.80139C20.1938 3.80147 21.0986 4.70714 21.0986 5.82385V8.82483H2.90039V5.82385C2.90039 4.70709 3.80609 3.80139 4.92285 3.80139H19.0771Z"
            fill={isActive ? "#4285F4" : "#ACACAC"}
          />
        </svg>
      ),
    },
    {
      label: "마이", //my
      path: "/patient/profile",
      icon: (isActive: boolean) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_51_4636)">
            <path d="M24 0H0V24H24V0Z" fill="white" />
            <path
              d="M4 17C4 14.7909 5.79086 13 8 13H16C18.2091 13 20 14.7909 20 17V18.5C20 19.3284 19.3284 20 18.5 20H5.5C4.67157 20 4 19.3284 4 18.5V17Z"
              fill={isActive ? "#4285F4" : "#ACACAC"}
              stroke={isActive ? "#4285F4" : "#ACACAC"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10Z"
              fill={isActive ? "#4285F4" : "#ACACAC"}
              stroke={isActive ? "#4285F4" : "#ACACAC"}
              strokeWidth="1.5"
            />
          </g>
          <defs>
            <clipPath id="clip0_51_4636">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed max-w-[450px] z-[999] mx-auto bottom-0 left-0 right-0 bg-white flex justify-around items-center p-3">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <div
            key={item.path}
            onClick={() => router.push(item.path)}
            className={cn(
              "flex flex-col items-center cursor-pointer",
              isActive ? "text-blue-500 fill-blue-500" : "text-gray-400"
            )}
          >
            {item.icon(isActive)}
            <span className="text-xs mt-1">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
