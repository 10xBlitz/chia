import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";
import { generateMetadata as createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  path: "/",
});

export default async function Page() {
  return (
    <MobileLayout className="!px-0 flex flex-col">
      <MainPage />
    </MobileLayout>
  );
}
