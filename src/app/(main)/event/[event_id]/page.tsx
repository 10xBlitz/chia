"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/back-button";
import { calculateDiscountedPrice, parseDateFromSupabase } from "@/lib/utils";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.event_id as string;

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("event")
        .select("*, clinic_treatment!inner(*, clinic!inner(*), treatment(*))")
        .eq("id", eventId)
        .eq("status", "active")
        .neq("clinic_treatment.clinic.status", "deleted")
        .single();
      if (error) throw error;
      return data;
    },
    retry: 1,
  });

  const handleBookEvent = () => {
    if (!event) return;

    const originalAmount = event.amount || 0;
    const discountedAmount = calculateDiscountedPrice(
      originalAmount,
      event.discount
    );

    const paymentUrl = `/patient/payment/event?orderId=${event.id}&amount=${discountedAmount}&eventName=${event.title}&treatmentName=${event.clinic_treatment.treatment.treatment_name}&treatmentOriginalPrice=${originalAmount}`;

    router.push(paymentUrl);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">이벤트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">이벤트를 찾을 수 없습니다.</p>
          <BackButton />
        </div>
      </div>
    );
  }

  const dateRange = parseDateFromSupabase(event.date_range as string);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[450px] mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-white z-10 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <BackButton />
            <h1 className="font-semibold text-lg">이벤트 상세</h1>
            <div className="w-10"></div> {/* Spacer for center alignment */}
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Title and Discount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-end">
              <div className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1">
                {event.discount}% 할인
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
          </div>

          {/* Clinic Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              병원 정보
            </h3>
            <div className="space-y-1">
              <p className="font-medium">
                {event.clinic_treatment.clinic.clinic_name}
              </p>
              <p className="text-sm text-gray-600">
                {event.clinic_treatment.clinic.region}
              </p>
            </div>
          </div>

          {/* Treatment Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">치료 정보</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-700">
                {event.clinic_treatment.treatment.treatment_name}
              </p>
            </div>
          </div>

          {/* Price Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">가격 정보</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">원가</span>
                <span className="text-gray-500 line-through">
                  {event.amount?.toLocaleString('ko-KR')}원
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">할인가</span>
                <span className="font-bold text-red-600 text-lg">
                  {calculateDiscountedPrice(event.amount || 0, event.discount).toLocaleString('ko-KR')}원
                </span>
              </div>
            </div>
          </div>

          {/* Event Period */}
          {dateRange && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                이벤트 기간
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  {format(dateRange.from, "yyyy년 M월 d일", { locale: ko })} -{" "}
                  {format(dateRange.to, "yyyy년 M월 d일", { locale: ko })}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">이벤트 상세</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* Main Image */}
          {event.image_url && (
            <div className="">
              <h3 className="font-semibold text-gray-900 mb-3">
                이벤트 이미지
              </h3>
              <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={event.image_url}
                  alt={event.title}
                  width={450}
                  height={0}
                  className="w-full h-auto object-contain"
                  style={{ height: "auto" }}
                  placeholder="empty"
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <Button
            onClick={handleBookEvent}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
          >
            이벤트 결제하기
          </Button>
        </div>
      </div>
    </div>
  );
}
