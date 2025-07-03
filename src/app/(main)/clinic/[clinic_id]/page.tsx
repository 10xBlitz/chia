"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock3, Phone, Youtube, EditIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import {
  addClinicToFavorites,
  checkIfClinicIsFavorite,
  removeClinicFromFavorites,
} from "@/lib/supabase/services/favorites.service";
import toast from "react-hot-toast";
import Link from "next/link";
import BackButton from "@/components/back-button";
import BookmarkButton from "@/components/bookmark";
import BottomNavigation from "@/components/bottom-navigation";
import MobileLayout from "@/components/layout/mobile-layout";
import ClinicReviewCard from "@/components/clinic-review-card";
import ClinicCardSkeleton from "@/components/loading-skeletons/clinic-card-skeleton";
import ClinicReviewCardSkeleton from "@/components/loading-skeletons/clinic-review-skeleton";
import { fetchClinicReviews } from "@/lib/supabase/services/reviews.services";
import { getClinic } from "@/lib/supabase/services/clinics.services";
import { Database } from "@/lib/supabase/types";
import { ensureHttpProtocol } from "@/lib/utils";
// import ZoomableImage from "@/components/zoomable-image";

const TABS = [
  { key: "info", label: "병원정보" }, // Hospital Info
  { key: "treatments", label: "진료정보" }, // Treatment Info
  { key: "photos", label: "사진" }, // Photos
  { key: "reviews", label: "리뷰" }, // Reviews
];

//used to map the days in the database
const days = [
  "일요일", // Sunday
  "월요일", // Monday
  "화요일", // Tuesday
  "수요일", // Wednesday
  "목요일", // Thursday
  "금요일", // Friday
  "토요일", // Saturday
] as const;

const PAGE_SIZE = 10;

// Change prop signature to accept all clinic fields as top-level props

export default function ClinicSingleViewPage() {
  const { clinic_id } = useParams<{ clinic_id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [workingHourToday, setWorkingHourToday] = useState<{
    clinic_id: string;
    created_at: string;
    day_of_week: Database["public"]["Enums"]["day_of_week"];
    id: string;
    time_open_from: string;
    time_open_to: string;
    formattedTimeOpenNow: string;
  }>();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const queryclient = useQueryClient();

  // TanStack Query to fetch clinic details
  const {
    data: clinic,
    isLoading: isClinicLoading,
    error: clinicError,
  } = useQuery({
    queryKey: ["clinic-detail", clinic_id],
    queryFn: () => getClinic(clinic_id),
    enabled: !!clinic_id,
  });

  // Use anchor IDs for scroll-to-section
  const tabAnchors = {
    info: "clinic-info",
    treatments: "clinic-treatments",
    photos: "clinic-photos",
    reviews: "clinic-reviews",
  };

  // Infinite query for reviews
  const {
    data: reviewsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingReviews,
  } = useInfiniteQuery({
    queryKey: ["clinic-reviews", clinic_id],
    queryFn: ({ pageParam = 0 }) =>
      fetchClinicReviews({ pageParam, clinic_id, pageSize: PAGE_SIZE }),
    enabled: !!clinic_id,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.reviews.length / PAGE_SIZE : undefined,
    initialPageParam: 0,
  });

  // Flatten reviews
  const reviews =
    reviewsPages?.pages.flatMap((page) =>
      page.reviews.map((review) => ({
        userId: review.user.id,
        id: review.id,
        full_name: review.user?.full_name || "익명", // Anonymous if no user
        images: review.images || [],
        rating: review.rating || "0",
        created_at: review.created_at,
        review: review.review || "리뷰 내용이 없습니다.", // No review content
      }))
    ) || [];

  // Refs for tab sections
  const infoRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const treatmentsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  // Scroll to section using anchor
  const handleTabClick = (key: keyof typeof tabAnchors) => {
    const refMap = {
      info: infoRef,
      treatments: treatmentsRef,
      photos: photosRef,
      reviews: reviewsRef,
    };
    const ref = refMap[key];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (isFavorite && favoriteId) {
      await removeClinicFromFavorites(favoriteId);
      setIsFavorite(false);
      setFavoriteId(null);
    } else {
      const data = await addClinicToFavorites(user.id, clinic_id);
      if (data) {
        setIsFavorite(true);
        setFavoriteId(data);
      }
    }
  };

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.id || !clinic?.id) return;
      const { isFavorite, favoriteId } = await checkIfClinicIsFavorite(
        user.id,
        clinic.id
      );
      setIsFavorite(isFavorite);
      setFavoriteId(favoriteId);
    };
    checkFavorite();

    if (clinic?.id) {
      const wh = getWorkingHourToday(clinic?.working_hour);
      setWorkingHourToday(wh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, clinic?.id]);

  // Copy address to clipboard
  const handleCopyAddress = () => {
    if (clinic?.region) {
      navigator.clipboard.writeText(String(clinic.full_address));
      toast.success("주소가 클립보드에 복사되었습니다."); // Address copied to clipboard
    }
  };

  console.log("------>11111");

  // Show loading skeleton if loading or no clinic data
  if (isClinicLoading || !clinic) {
    return (
      <MobileLayout>
        <ClinicCardSkeleton />
        <div className="p-4">
          <ClinicReviewCardSkeleton />
          <ClinicReviewCardSkeleton />
        </div>
      </MobileLayout>
    );
  }

  console.log("----->222222clinic", clinic);

  if (clinicError) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-red-500">
            병원 정보를 불러오는 데 오류가 발생했습니다. 나중에 다시
            시도해주세요.
            {/* Failed to load hospital info. Please try again later. */}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/")}
          >
            홈으로 돌아가기
            {/* Go back to home */}
          </Button>
        </div>
      </MobileLayout>
    );
  }

  console.log("------->333333clinic", clinic);

  return (
    <MobileLayout className="!px-0 relative">
      <div className="flex flex-col !px-0 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 bg-white z-20">
          <BackButton link="/" />
          {user?.id && (
            <BookmarkButton
              isActive={isFavorite}
              className=""
              activeStyle="!-mr-3  !min-h-9 !min-w-9"
              notActiveStyle="!-mr-3 !min-h-9 !min-w-9 stroke-1"
              handleBookmarkClick={handleBookmarkClick}
            />
          )}
        </div>
        <div className="w-full h-[180px] relative">
          <Image
            src={clinic.pictures?.[0] || "/images/fallback-image.png"}
            alt={clinic.clinic_name}
            priority
            {...(clinic.pictures?.[0]
              ? { fill: true }
              : { width: 200, height: 200 })}
            className={
              !clinic.pictures?.[0]
                ? "object-contain mx-auto my-auto flex items-center justify-center bg-white"
                : "object-cover"
            }
            style={
              !clinic.pictures?.[0]
                ? { display: "block", margin: "0 auto", background: "#fff" }
                : undefined
            }
          />
        </div>

        {/* Clinic Card Section (before tabs) */}
        <div
          className="bg-white px-6 pb-6"
          style={{ zIndex: 1, position: "relative" }}
        >
          <div className="pt-8 pb-2">
            <h1 className="text-2xl font-bold">{clinic.clinic_name}</h1>
            <div className="flex items-center gap-1 text-yellow-500 mt-1">
              <Star size={20} fill="currentColor" />
              <span className="font-semibold text-lg">
                {reviews.length > 0
                  ? (
                      reviews.reduce(
                        (sum: number, r) => sum + (Number(r.rating) ?? 0),
                        0
                      ) / reviews.length
                    ).toFixed(1)
                  : "0"}
              </span>
              <span className="text-gray-500 text-base ml-1">
                ({reviews.length > 0 ? reviews.length : "0"})
              </span>
              <span className="text-gray-400 text-sm ml-2">
                리뷰 {/**Reviews */} {reviews.length ?? 0}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-gray-700 text-[15px]">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-black" />
              <span>{clinic.full_address || "no location"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              <span>
                (
                {(() => {
                  const days = [
                    "일", // Sunday
                    "월", // Monday
                    "화", // Tuesday
                    "수", // Wednesday
                    "목", // Thursday
                    "금", // Friday
                    "토", // Saturday
                  ];

                  const todayIdx = new Date().getDay();
                  const todayKor = days[todayIdx === 0 ? 0 : todayIdx];

                  return todayKor;
                })()}
                ) {workingHourToday?.formattedTimeOpenNow}
                {/* Clinic closes today */}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>
                전화번호 {/* Phone number */}
                <Link
                  href={`tel:${clinic.contact_number}`}
                  className=" underline"
                >
                  {formatKoreanPhoneNumber(clinic.contact_number)}
                </Link>
              </span>
            </div>
            <Link
              href={ensureHttpProtocol(clinic.link || "")}
              target="_blank"
              className="flex items-center gap-2 text-ellipsis"
            >
              <Youtube className="h-4 w-4" />
              <span>
                유튜브 {/* YouTube */}
                <span className="underline cursor-pointer text-ellipsis ">
                  {clinic.link}
                </span>
              </span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mt-4 bg-white sticky top-0 z-10">
          {TABS.map((t) => (
            <button
              key={t.key}
              className="flex-1 py-3 text-center text-sm font-medium text-gray-500 hover:text-blue-600"
              onClick={() => handleTabClick(t.key as keyof typeof tabAnchors)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 pb-20">
          {/* Info Section */}
          <div id={tabAnchors.info} ref={infoRef} className="scroll-mt-16">
            {/* 병원 소개 (Clinic Introduction) */}
            <div className="mt-6">
              <div className="font-semibold text-xl mb-2">병원 소개</div>
              {/* Clinic Introduction */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {clinic.introduction}
                </p>
              </div>
            </div>
            {/* 진료 시간 (Opening Hours) */}
            <div className="mt-6">
              <div className="font-semibold text-xl mb-2">진료 시간</div>
              {/* Opening Hours */}
              {/* Today section */}
              <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center mb-4">
                <div>
                  <div className="font-medium">
                    오늘
                    {/* Today */}
                  </div>
                  <div className="text-base mt-1">
                    {(() => {
                      // Map JS day to Korean day string
                      const days = [
                        "일요일", // Sunday
                        "월요일", // Monday
                        "화요일", // Tuesday
                        "수요일", // Wednesday
                        "목요일", // Thursday
                        "금요일", // Friday
                        "토요일", // Saturday
                      ];
                      const todayIdx = new Date().getDay();
                      const todayKor = days[todayIdx === 0 ? 0 : todayIdx]; // 0 is Sunday
                      const wh =
                        clinic.working_hour &&
                        clinic.working_hour.find(
                          (w) => w.day_of_week === todayKor
                        );
                      //convert working hour to korean

                      return wh
                        ? `${toKoreanTime(wh.time_open_from)} - ${toKoreanTime(
                            wh.time_open_to
                          )}`
                        : "-";
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    점심 시간 {/* Lunch time */}
                  </div>
                  <div className="text-base mt-1">
                    {(() => {
                      // If no lunch time, return empty string
                      const lunchTime = clinic.working_hour.find(
                        (item) => item.day_of_week === "점심시간"
                      );
                      return lunchTime
                        ? `${toKoreanTime(
                            lunchTime.time_open_from
                          )} - ${toKoreanTime(lunchTime.time_open_to)}`
                        : "";
                    })()}
                  </div>
                  {/* Call for info */}
                </div>
              </div>
              {/* All days section */}
              <div className="bg-gray-100 rounded-xl p-4">
                {days.map((day) => {
                  const wh = clinic.working_hour?.find(
                    (w) => w.day_of_week === day
                  );

                  if (wh === undefined) {
                    return <span key={day}></span>;
                  }
                  return (
                    <div key={day} className="mb-4 last:mb-0">
                      <div className="font-medium">{day}</div>
                      <div className="text-base">
                        {wh
                          ? `${toKoreanTime(
                              wh.time_open_from
                            )} - ${toKoreanTime(wh.time_open_to)}`
                          : "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* 위치 (Location) */}
            <div className="mt-6">
              <div className="font-semibold mb-2 text-xl">
                위치 {/**Location */}
              </div>
              <div className="rounded-lg overflow-hidden">
                <div className="w-full h-40 bg-gray-200 mb-2 relative">
                  <iframe
                    title="clinic-map"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: 160 }}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      clinic.full_address || ""
                    )}&output=embed`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    {clinic.full_address || "no region"}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 bg-gray-100"
                    onClick={handleCopyAddress}
                  >
                    주소복사
                    {/* Copy Address */}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Treatments Section */}
          <div
            id={tabAnchors.treatments}
            ref={treatmentsRef}
            className="scroll-mt-16 mt-10"
          >
            <div className="font-semibold mb-2 text-xl">
              진료 항목 {/** Medical Items */}
            </div>
            <div className=" mb-2">
              총 {clinic.clinic_treatment ? clinic.clinic_treatment.length : 0}
              개 {/**A total of {number} */}
            </div>
            <div className="flex flex-wrap gap-2">
              {clinic.clinic_treatment?.map((ct) => (
                <span
                  key={ct.id}
                  className="bg-gray-100 rounded-md px-3 py-1 text-xs"
                >
                  {ct.treatment?.treatment_name}
                </span>
              ))}
            </div>
          </div>

          {/* Photos Section */}
          <div
            id={tabAnchors.photos}
            ref={photosRef}
            className="scroll-mt-16 mt-10"
          >
            <div className="font-semibold text-xl mb-2">사진</div>{" "}
            {/* Photos */}
            <div className="grid grid-cols-3 gap-2">
              {clinic.pictures?.map((pic: string, idx: number) => (
                <div
                  key={idx}
                  className="aspect-square relative rounded-lg overflow-hidden"
                >
                  <Image
                    src={pic}
                    alt={`clinic-photo-${idx}`}
                    fill
                    className="object-cover"
                  />

                  {/* <ZoomableImage src={pic} alt={`clinic-photo-${idx}`} /> */}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div
            id={tabAnchors.reviews}
            ref={reviewsRef}
            className="scroll-mt-16 mt-10"
          >
            <div className="font-semibold mb-2 text-xl">
              방문자 리뷰 {reviews.length} {/* Visitor Reviews */}
            </div>
            <div className="flex flex-col gap-6">
              {isLoadingReviews && (
                <div className="text-center text-gray-400 py-8">
                  리뷰를 불러오는 중입니다...
                  {/* Loading reviews... */}
                </div>
              )}
              {!isLoadingReviews && reviews.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  아직 리뷰가 없습니다. {/* No reviews yet */}
                </div>
              )}
              {reviews.map((review) => (
                <ClinicReviewCard
                  {...review}
                  key={review.id}
                  hasEditDeleteButtons={user?.id === review.userId}
                  onclick={() => router.push(`/patient/review`)}
                  deleteSuccessCallback={() =>
                    queryclient.invalidateQueries({
                      queryKey: ["clinic-reviews", clinic_id],
                    })
                  }
                />
              ))}
              {hasNextPage && (
                <Button
                  className="mx-auto mt-4"
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "로딩 중..." : "리뷰 더보기"}
                  {/* Load more reviews */}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="max-w-[460px] w-full mx-auto bg-white flex gap-2 px-4 py-3 mb-20">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              router.push(
                `/patient/quotation/create-quotation?clinic_id=${clinic_id}&clinic_name=${clinic.clinic_name}`
              )
            }
          >
            견적 요청 {/* Request for quote */}
          </Button>
          <Link
            href={`/patient/reservation/create-reservation?clinic_id=${clinic_id}`}
            className="flex-1"
          >
            <Button variant="outline" className="w-full">
              예약하기 {/* Make Reservation */}
            </Button>
          </Link>
        </div>

        {/* Floating review button */}
        <div
          className="
            fixed z-30
            bottom-24
            left-1/2
            -translate-x-1/2
            md:left-auto md:translate-x-0
            max-w-[450px] w-full
            pointer-events-none
            flex justify-end
            px-4
          "
          style={{ maxWidth: 450, width: "100%" }}
        >
          <div className="pointer-events-auto">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center transition-all
                w-12 h-12 justify-center
                md:w-12 md:h-12 md:justify-center
                md:overflow-hidden
                group
                md:hover:w-44"
              style={{ fontWeight: 500, fontSize: 16, minWidth: 48 }}
              onClick={() => {
                router.push(
                  `/patient/review/create-review?clinic_id=${clinic_id}`
                );
              }}
            >
              <EditIcon className="w-6 h-6" />
              {/* Only show text on desktop and only on hover */}
              <span className="hidden md:whitespace-nowrap md:ml-2 md:group-hover:inline-block transition-opacity duration-200">
                리뷰 쓰기 {/* Write a Review */}
              </span>
            </Button>
          </div>
        </div>
        {user?.id && <BottomNavigation forceActiveIndex={0} />}
      </div>
    </MobileLayout>
  );
}

// Convert time_open_from and time_open_to to Korean format (e.g., "09:00" -> "오전 9:00")
const toKoreanTime = (time: string) => {
  if (!time) return "";
  const [hourStr, minute] = time.split(":");
  let hour = Number(hourStr);
  const isAM = hour < 12;
  const period = isAM ? "오전" : "오후"; // AM/PM in Korean
  if (!isAM && hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${period} ${hour}:${minute}`;
};

function getWorkingHourToday(
  workingHour: {
    clinic_id: string;
    created_at: string;
    day_of_week: Database["public"]["Enums"]["day_of_week"];
    id: string;
    time_open_from: string;
    time_open_to: string;
  }[]
) {
  const todayIdx = new Date().getDay();
  const todayKor = days[todayIdx === 0 ? 0 : todayIdx]; // 0 is Sunday
  const wh = workingHour.find((w) => w.day_of_week === todayKor);

  // Check if clinic is closed for today
  if (!wh) {
    return {
      clinic_id: "",
      created_at: "",
      day_of_week: "일요일" as Database["public"]["Enums"]["day_of_week"],
      id: "",
      time_open_from: "",
      time_open_to: "",
      formattedTimeOpenNow: "영업종료", // Closed
    };
  }

  // Check if current time is past closing time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const [closeHour, closeMinute] = wh.time_open_to.split(":").map(Number);
  const closeTimeInMinutes = closeHour * 60 + closeMinute;

  const isClosed = currentTimeInMinutes >= closeTimeInMinutes;

  const formattedOpenTime = toKoreanTime(wh.time_open_from);
  const formattedCloseTime = toKoreanTime(wh.time_open_to);

  console.log("---->wh", wh);

  return {
    clinic_id: wh.clinic_id,
    created_at: wh.created_at,
    day_of_week: wh.day_of_week,
    id: wh.id,
    time_open_from: formattedOpenTime,
    time_open_to: formattedCloseTime,
    formattedTimeOpenNow: isClosed
      ? "영업종료"
      : `${formattedOpenTime} - ${formattedCloseTime}`, // Show "영업종료" if closed
  };
}

// Format a phone number to Korean style (handles 010-0000-0000, +8210-0000-0000, 02-0000-0000, 02-000-0000)
//AI generated code. But seems fine, so far no errors when testing manually
function formatKoreanPhoneNumber(phone: string = ""): string {
  if (!phone) return "";
  // Remove all non-digit characters except leading +
  let digits = phone.trim();
  if (digits.startsWith("+82")) {
    // Convert +82XX... to 0XX...
    digits = "0" + digits.slice(3);
  }
  digits = digits.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    // Mobile: 010-1234-5678
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10 && digits.startsWith("010")) {
    // Old mobile: 010-123-4567 (rare)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 10 && digits.startsWith("02")) {
    // Seoul: 02-1234-5678
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 9 && digits.startsWith("02")) {
    // Seoul: 02-123-4567
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  } else if (digits.length === 10) {
    // Other area codes: 031-123-4567
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone; // fallback
}
