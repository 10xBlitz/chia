import React from "react";
import ClinicSingleViewMainComponent from "./clinic-detail-main";
import { Metadata } from "next";
import { fetchClinicDetail } from "@/lib/supabase/services/clinics.services";

type Props = {
  params: Promise<{ clinic_id: string }>;
};

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

function ClinicSingleViewPage() {
  return <ClinicSingleViewMainComponent />;
}

export default ClinicSingleViewPage;
