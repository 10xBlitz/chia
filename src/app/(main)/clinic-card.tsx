import Image from "next/image";

interface ClinicCardProps {
  clinic_name: string;
  contact_number: string;
  created_at: string;
  id: string;
  link: string | null;
  location: string;
  opening_date: string;
  pictures: string[] | null;
  region: string;
  views: number;
  clinic_treatment: {
    id: string;
    reservation: {
      clinic_treatment_id: string;
      consultation_type: string;
      contact_number: string;
      dentist_id: string | null;
      id: string;
      patient_id: string;
      reservation_date: string;
      reservation_time: string;
      status: string;
    }[];
    review: {
      clinic_treatment_id: string;
      created_at: string;
      id: string;
      images: string[] | null;
      rating: number;
      review: string | null;
    }[];
  }[];
}

export default function ClinicCard(clinic: ClinicCardProps) {
  // Get all reviews
  const allReviews =
    clinic.clinic_treatment?.flatMap((ct) => ct.review ?? []) ?? [];
  const avgRating =
    allReviews.length > 0
      ? (
          allReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
          allReviews.length
        ).toFixed(1)
      : "-";

  return (
    <div className="p-4 border-b">
      <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-200 mb-3">
        {clinic.pictures && clinic.pictures[0] && (
          <Image
            src={clinic.pictures[0]}
            alt={clinic.clinic_name}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/auth-main.svg";
            }}
          />
        )}
      </div>
      <div className="font-semibold text-lg">{clinic.clinic_name}</div>
      <div className="flex items-center text-gray-500 text-base mt-1">
        <span className="text-yellow-500 mr-1">★</span>
        <span>{avgRating}</span>
        <span className="ml-1">({allReviews.length})</span>
      </div>
    </div>
  );
}
