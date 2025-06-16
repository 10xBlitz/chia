import React from "react";
import ClinicSingleViewMainComponent from "./clinic-detail-main";
import { Metadata } from "next";
import { fetchClinicDetail } from "@/lib/supabase/services/clinics.services";
import { supabaseClient } from "@/lib/supabase/client";

type Props = {
  params: Promise<{ clinic_id: string }>;
};

export const dynamic = "force-static"; // Ensure static generation

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const { clinic_id } = await params;

  // fetch data
  const clinic = await fetchClinicDetail(clinic_id);

  return {
    openGraph: {
      //korean description
      title: clinic.clinic_name,
      locale: "ko_KR",
      type: "website",
      url: `https://chia-azure.vercel.app/clinic/${clinic_id}`,
      siteName: "치과 시술 플랫폼", // "Dental Procedure Platform"
      images: [
        {
          url:
            clinic.pictures?.[0] ||
            "https://chia-azure.vercel.app/images/chia-logo.png",
          alt: clinic.clinic_name || "Clinic Image",
          width: 100,
          height: 100,
        },
      ],
    },
  };
}

// Add generateStaticParams for static generation of clinic detail pages
export async function generateStaticParams() {
  // Fetch all clinic IDs for static generation using Supabase client
  const { data: clinics, error } = await supabaseClient
    .from("clinic")
    .select("id");
  if (error) throw error;
  return (clinics || []).map((clinic: { id: string }) => ({
    clinic_id: clinic.id,
  }));
}

export default async function ClinicSingleViewPage({ params }: Props) {
  const { clinic_id } = await params;
  const clinic = await fetchClinicDetail(clinic_id);

  return (
    <>
      {/* Pass clinic as a flat prop, not as an object with a 'clinic' key */}
      <ClinicSingleViewMainComponent {...clinic} />
    </>
  );
}
