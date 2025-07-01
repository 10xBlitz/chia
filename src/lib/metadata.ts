import { Metadata } from "next";

interface MetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
}

const DEFAULT_TITLE = "치과 시술 플랫폼"; // "Dental Procedure Platform"
const DEFAULT_DESCRIPTION = "치과 시술 견적 및 예약 플랫폼"; // "Dental Procedure Quotation and Reservation Platform"
const DEFAULT_IMAGE = "https://chia-azure.vercel.app/images/chia-logo.png";
const BASE_URL = "https://chia-azure.vercel.app";

export function generateMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    path = "",
    image = DEFAULT_IMAGE,
    type = "website",
  } = options;

  const fullTitle =
    title === DEFAULT_TITLE ? title : `${title} | ${DEFAULT_TITLE}`;
  const url = `${BASE_URL}${path}`;

  return {
    title: fullTitle,
    description,
    icons: {
      icon: "https://chia-azure.vercel.app/images/chia-logo.svg",
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "Chia",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: "Chia Logo",
        },
      ],
      locale: "ko_KR",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
