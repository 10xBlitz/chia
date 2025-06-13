import { Metadata } from "next";
import ClinicDetailPage from "./clinic-detail";
import { supabaseClient } from "@/lib/supabase/client";

// Separate function to fetch clinic detail
async function fetchClinicDetail(clinic_id: string) {
  // const supabase = await createClient();
  const { data: clinic } = await supabaseClient
    .from("clinic")
    .select(
      `
      *,
      working_hour(*),
      clinic_treatment (
        id,
        treatment (
          id,
          treatment_name,
          image_url
        )
      )
    `
    )
    .eq("id", clinic_id)
    .single();
  return clinic;
}

type Props = {
  params: Promise<{ clinic_id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  console.log(searchParams);
  const slug = (await params).clinic_id;
  const clinic = await fetchClinicDetail(slug);
  return {
    title: "치과 시술 플랫폼",
    description: `치과 시술 플랫폼에서 ${clinic?.clinic_name}에 대한 자세한 정보를 확인하세요.`,
    openGraph: {
      title: "치과 시술 플랫폼",
      description: `치과 시술 플랫폼에서 ${clinic?.clinic_name}에 대한 자세한 정보를 확인하세요.`,
      images: [
        {
          width: 800,
          height: 600,
          url: clinic?.pictures?.[0] || "",
          alt: clinic?.clinic_name,
        },
      ],
    },
  };
}

export default async function ClinicPage({ params, searchParams }: Props) {
  console.log(params, searchParams);
  return <ClinicDetailPage />;
}
