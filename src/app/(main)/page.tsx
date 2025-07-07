import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";

export default async function Page() {
  return (
    <MobileLayout className="!px-0 flex flex-col">
      <MainPage />
    </MobileLayout>
  );
}
