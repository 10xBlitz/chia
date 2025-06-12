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
        url: "https://hmhtqgzcqoxssuhtmscp.supabase.co/storage/v1/object/public/clinic-images//2471d7e1-f871-4bdd-ba84-9755cf7f38f3.png",
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
