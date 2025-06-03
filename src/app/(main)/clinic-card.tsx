import Image from "next/image";

interface ClinicCardProps {
  total_reviews: number;
  avg_reviews_per_treatment: number;
  clinic_name: string;
  contact_number: string;
  created_at: string;
  id: string;
  link: string | null;
  location: string;
  opening_date: string;
  pictures: string[] | null;
  region: string;
}

export default function ClinicCard(clinic: ClinicCardProps) {
  const avgReviews = clinic.avg_reviews_per_treatment
    ? clinic.avg_reviews_per_treatment.toFixed(1)
    : "0.0";
  const totalReviews = clinic.total_reviews || 0;
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
        <span>{avgReviews}</span>
        <span className="ml-1">({totalReviews})</span>
      </div>
    </div>
  );
}
