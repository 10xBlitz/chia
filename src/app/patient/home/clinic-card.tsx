import Image from "next/image";

interface ClinicCardProps {
  id: string;
  clinic_name: string;
  location: string;
  contact_number: string;
  link: string | null;
  pictures: string[] | null;
  views: number;
  opening_date: string;
  region: string;
  created_at: string;
  clinic_treatment: Array<{
    id: string;
    reservation: Array<{
      id: string;
      review: Array<{
        id: string;
        rating: number | null;
        review: string | null;
        created_at: string;
        reservation_id: string;
      }>;
    }>;
  }>;
}

export default function ClinicCard(clinic: ClinicCardProps) {
  // Get the average rating (may be undefined if no reviews)
  const allReviews =
    clinic.clinic_treatment?.flatMap(
      (ct) => ct.reservation?.flatMap((res) => res.review ?? []) ?? []
    ) ?? [];

  const avgRating =
    allReviews.length > 0
      ? (
          allReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
          allReviews.length
        ).toFixed(1)
      : "-";

  return (
    <div className="p-4 border-b">
      <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-200 mb-2">
        {/* Using a placeholder if image fails to load */}
        <div className="w-full h-full relative">
          {clinic.pictures && (
            <Image
              src={clinic.pictures[0]}
              alt={clinic.clinic_name}
              fill
              className="object-cover"
              onError={(e) => {
                // Replace with a default image if loading fails
                const target = e.target as HTMLImageElement;
                target.src = "/images/auth-main.svg";
              }}
            />
          )}
        </div>
      </div>
      <div className="font-medium">{clinic.clinic_name}</div>
      <div className="flex items-center text-sm mt-1">
        <span className="text-yellow-500">★</span>
        <span className="ml-1">{avgRating}</span>
      </div>
    </div>
  );
}
