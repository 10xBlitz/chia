"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
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

const TABS = [
  { key: "info", label: "병원정보" },
  { key: "photos", label: "사진" },
  { key: "treatments", label: "진료정보" },
  { key: "reviews", label: "리뷰" },
];

// Dynamically import map if needed
// const Map = dynamic(() => import("@/components/map"), { ssr: false });

async function fetchClinicDetail(clinic_id: string) {
  const { data, error } = await supabaseClient
    .from("clinic")
    .select(
      `
        *,
        clinic_view(*),
        working_hour(*),
        clinic_treatment (
            id,
            treatment (
                id,
                treatment_name,
                image_url
            ),
            review (
              *,
              user:patient_id(*)
            )
        )
      `
    )
    .eq("id", clinic_id)
    .single();
  if (error) throw error;
  return data;
}

export default function ClinicDetailPage() {
  const { clinic_id } = useParams<{ clinic_id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  // Use anchor IDs for scroll-to-section
  const tabAnchors = {
    info: "clinic-info",
    photos: "clinic-photos",
    treatments: "clinic-treatments",
    reviews: "clinic-reviews",
  };

  const { data: clinic, error } = useQuery({
    queryKey: ["clinic-detail", clinic_id],
    queryFn: () => fetchClinicDetail(clinic_id),
    enabled: !!clinic_id,
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true, // Refetch on window focus
    refetchOnReconnect: true, // Refetch on reconnect
    refetchOnMount: true, //  refetch on mount
    staleTime: 60000, // Data is fresh for 1 minute
  });

  // Flatten reviews: collect all reviews from all reservations in all clinic_treatment
  const reviews =
    clinic?.clinic_treatment
      ?.flatMap((ct) =>
        (ct.review || []).map((review) => ({
          ...review,
          user: review.user,
        }))
      )
      .filter(Boolean) || [];

  // Refs for tab sections
  const infoRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const treatmentsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  // Scroll to section using anchor
  const handleTabClick = (key: keyof typeof tabAnchors) => {
    const refMap = {
      info: infoRef,
      photos: photosRef,
      treatments: treatmentsRef,
      reviews: reviewsRef,
    };
    const ref = refMap[key];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
  }, [user?.id, clinic?.id]);

  useEffect(() => {
    const addViewCount = async () => {
      if (!clinic_id) return;
      if (!user?.id) return;
      const { error } = await supabaseClient
        .from("clinic_view")
        .insert([{ clinic_id: clinic_id, patient_id: user?.id }]);
      if (error) {
        console.error("Error updating view count:", error.message);
      }
    };
    addViewCount();
  }, []);

  // Copy address to clipboard
  const handleCopyAddress = () => {
    if (clinic?.location) {
      navigator.clipboard.writeText(clinic.location);
      toast.success("주소가 클립보드에 복사되었습니다.");
    }
  };

  if (!clinic) return <div className="p-8 text-center">Loading...</div>;
  if (error || !clinic)
    return (
      <div className="p-8 text-center">병원 정보를 불러올 수 없습니다.</div>
    );

  return (
    <MobileLayout className="!px-0">
      <div className="flex flex-col !px-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 bg-white z-20">
          <BackButton />
          <BookmarkButton
            isActive={isFavorite}
            handleBookmarkClick={handleBookmarkClick}
          />
        </div>
        <div className="w-full h-[180px] relative">
          <Image
            src={clinic.pictures?.[0] || "/images/clinic-default.jpg"}
            alt={clinic.clinic_name}
            fill
            className="object-cover"
            priority
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
                        (sum: number, r) => sum + (r.rating ?? 0),
                        0
                      ) / reviews.length
                    ).toFixed(1)
                  : "0"}
              </span>
              <span className="text-gray-500 text-base ml-1">
                ({reviews.length > 0 ? reviews.length : "0"})
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-gray-700 text-[15px]">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-black" />
              <span>{clinic.location || "no location"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              <span>
                진료종료 오늘{" "}
                {clinic.working_hour && clinic.working_hour.length > 0
                  ? clinic.working_hour[0].time_open
                  : "9:30 ~ 14:00"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>
                전화번호
                <a href={`tel:${clinic.contact_number}`} className=" underline">
                  {clinic.contact_number}
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              <span>
                유튜브{" "}
                <span className="underline cursor-pointer">{clinic.link}</span>
              </span>
            </div>
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
            {/* 진료 시간 (Opening Hours) */}
            <div className="mt-6">
              <div className="font-semibold mb-2">진료 시간</div>
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
                      return wh ? wh.time_open : "-";
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">점심 시간</div>{" "}
                  {/* Lunch time */}
                  <div className="text-base mt-1">
                    전화 문의{/**Phone Inquiry */}
                  </div>
                  {/* Call for info */}
                </div>
              </div>
              {/* All days section */}
              <div className="bg-gray-100 rounded-xl p-4">
                {(clinic.working_hour && clinic.working_hour.length > 0
                  ? clinic.working_hour
                  : [
                      { day_of_week: "월요일", time_open: "00:00 ~ 00:00" }, // Monday
                      { day_of_week: "화요일", time_open: "00:00 ~ 00:00" }, // Tuesday
                      { day_of_week: "수요일", time_open: "00:00 ~ 00:00" }, // Wednesday
                      { day_of_week: "목요일", time_open: "00:00 ~ 00:00" }, // Thursday
                      { day_of_week: "금요일", time_open: "00:00 ~ 00:00" }, // Friday
                      { day_of_week: "토요일", time_open: "00:00 ~ 00:00" }, // Saturday
                      { day_of_week: "일요일", time_open: "00:00 ~ 00:00" }, // Sunday
                    ]
                ).map((wh) => (
                  <div key={wh.day_of_week} className="mb-4 last:mb-0">
                    <div className="font-medium">{wh.day_of_week}</div>
                    <div className="text-base">{wh.time_open || "-"}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* 위치 (Location) */}
            <div className="mt-6">
              <div className="font-semibold mb-2">위치 {/**Location */}</div>
              <div className="rounded-lg overflow-hidden">
                <div className="w-full h-40 bg-gray-200 mb-2 relative">
                  <iframe
                    title="clinic-map"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: 160 }}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      clinic.location || clinic.region || ""
                    )}&output=embed`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    {clinic.location || "no location"}
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
            {/* 시설 (Facilities) */}
            <div className="mt-6">
              <div className="font-semibold mb-2">시설</div>
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
          </div>

          {/* Photos Section */}
          <div
            id={tabAnchors.photos}
            ref={photosRef}
            className="scroll-mt-16 mt-10"
          >
            <div className="font-semibold mb-2">사진</div> {/* Photos */}
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
                </div>
              ))}
            </div>
          </div>

          {/* Treatments Section */}
          {/* <div
          id={tabAnchors.treatments}
          ref={treatmentsRef}
          className="scroll-mt-16 mt-10"
        >
          <div className="font-semibold mb-2">진료 항목</div>{" "}
          <ul className="list-disc list-inside text-sm">
            {clinic.clinic_treatment?.map((ct: any) => (
              <li key={ct.id}>{ct.treatment?.treatment_name}</li>
            ))}
          </ul>
        </div> */}

          {/* Reviews Section */}
          <div
            id={tabAnchors.reviews}
            ref={reviewsRef}
            className="scroll-mt-16 mt-10"
          >
            <div className="font-semibold mb-2">
              방문자 리뷰 {reviews.length} {/* Visitor Reviews */}
            </div>
            <div className="flex flex-col gap-6">
              {reviews.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  아직 리뷰가 없습니다. {/* No reviews yet */}
                </div>
              )}
              {reviews.map((review, idx: number) => (
                <div
                  key={review.id || idx}
                  className="bg-[#F6FAFF] rounded-xl px-4 py-6"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#E9EEF3] flex items-center justify-center">
                      <span className="text-2xl text-gray-400">
                        {/* User icon */}
                        <svg
                          width="28"
                          height="28"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="8" r="4" fill="#B0B8C1" />
                          <rect
                            x="4"
                            y="16"
                            width="16"
                            height="6"
                            rx="3"
                            fill="#B0B8C1"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">
                        {review.user?.full_name || "김00"}
                      </div>
                    </div>
                  </div>
                  {/* Images */}
                  {Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="flex gap-3 mb-3 flex-wrap">
                      {review.images.map((img: string, i: number) => (
                        <div
                          key={i}
                          className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0"
                        >
                          <Image
                            src={img}
                            alt={`review-img-${i}`}
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500 flex items-center gap-1 font-medium text-base">
                      <Star size={18} fill="currentColor" />
                      {review.rating || "4.2"}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {review.created_at
                        ? (() => {
                            const d = new Date(review.created_at);
                            return `${d.getFullYear()}. ${
                              d.getMonth() + 1
                            }. ${d.getDate()}`;
                          })()
                        : ""}
                    </span>
                  </div>
                  <div className="text-[15px] leading-relaxed whitespace-pre-line">
                    {review.review}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="max-w-[460px] w-full mx-auto bg-white  flex gap-2 px-4 py-3 mb-20">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              router.push(
                "/patient/quotation/create-quotation?clinic_id=" + clinic_id
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
        <Button
          className="fixed bottom-24 right-6 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 transition-all"
          style={{ fontWeight: 500, fontSize: 16 }}
          onClick={() => {
            router.push(`/patient/review/create-review?clinic_id=${clinic_id}`);
          }}
        >
          <EditIcon />
          리뷰 쓰기 {/* Write a Review */}
        </Button>
        {user?.id && <BottomNavigation />}
      </div>
    </MobileLayout>
  );
}
