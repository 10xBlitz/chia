import { Metadata } from "next";
import MainPage from "./(main)/main-content";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about our dental platform.",
  openGraph: {
    title: "About Us",
    description: "Learn more about our dental platform.",
    images: [
      {
        url: "https://chia-azure.vercel.app/images/fallback-image.png",
        width: 800,
        height: 600,
        alt: "About OG Image",
      },
    ],
    type: "website",
  },
};

function Page() {
  return <MainPage />;
}

export default Page;
