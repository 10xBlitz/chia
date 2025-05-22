"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AddressSelectorProps {
  onAddressSelect: (city: string, region: string) => void;
  initialCity?: string;
  initialRegion?: string;
}

export default function AddressSelector({
  onAddressSelect,
  initialCity,
  initialRegion,
}: AddressSelectorProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(
    initialCity || null
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(
    initialRegion || null
  );

  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [isRegionDialogOpen, setIsRegionDialogOpen] = useState(false);

  // Determine what to display initially or when no address is selected
  const displayAddress =
    selectedCity && selectedRegion
      ? `${selectedCity} ${selectedRegion}`
      : "주소 선택"; // "Select Address"

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setSelectedRegion(null); // Reset region when city changes
    setIsCityDialogOpen(false); // Close city dialog
    setIsRegionDialogOpen(true); // Open region dialog
  };

  const handleRegionSelect = (region: string) => {
    if (selectedCity) {
      setSelectedRegion(region);
      onAddressSelect(selectedCity, region); // Callback to parent with full address
      setIsRegionDialogOpen(false); // Close region dialog
    }
  };

  const handleGoBackToCitySelection = () => {
    setSelectedRegion(null); // Clear region
    setIsRegionDialogOpen(false); // Close region dialog
    setIsCityDialogOpen(true); // Open city dialog
  };

  return (
    <>
      {/* Main button to open the selection */}
      <Button
        type="button"
        onClick={() => {
          if (!selectedCity) {
            // If no city is selected, open city dialog
            setIsCityDialogOpen(true);
          } else {
            // If city is selected, decide whether to open region or city dialog
            setIsRegionDialogOpen(true);
          }
        }}
        variant="outline"
        className="w-full justify-start text-left text-gray-700" // Adjust style as needed
      >
        {displayAddress}
      </Button>

      {/* City Selection Dialog */}
      <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
        <DialogContent
          className="max-w-[400px] h-[60vh] flex flex-col overflow-y-scroll"
          style={{ scrollbarWidth: "thin" }}
        >
          <DialogHeader>
            <DialogTitle>도시 선택 {/**(Select City) */}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ScrollArea>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Responsive grid for cities */}
              {Object.keys(koreanAddressData).map((city) => (
                <Button
                  key={city}
                  variant={selectedCity === city ? "default" : "outline"}
                  onClick={() => handleCitySelect(city)}
                  className={cn(
                    "rounded-md", // Default shadcn rounded
                    selectedCity === city
                      ? "bg-blue-600 text-white hover:bg-blue-700" // Selected style
                      : "border-gray-300 text-gray-700 hover:bg-gray-50" // Unselected style
                  )}
                >
                  {city}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Region Selection Dialog */}
      <Dialog open={isRegionDialogOpen} onOpenChange={setIsRegionDialogOpen}>
        <DialogContent
          className="max-w-[400px] h-[60vh] flex flex-col overflow-y-scroll"
          style={{ scrollbarWidth: "thin" }}
        >
          <DialogHeader className="mb-4">
            {/* Top-left selected city display and back button */}
            <div className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBackToCitySelection}
                className="p-1 h-auto text-blue-600 hover:bg-blue-50"
              >
                <span className="mr-1">도시 선택 </span> {/* "Select City" */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
              {selectedCity && (
                <span
                  className="ml-1 text-lg font-bold text-blue-600 cursor-pointer"
                  onClick={handleGoBackToCitySelection}
                >
                  {selectedCity}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 inline-block ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              )}
            </div>
            <DialogTitle>지역 선택 {/**(Select Region) */}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow pr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {" "}
              {/* Grid for regions */}
              {selectedCity &&
                (
                  Object.keys(koreanAddressData) as Array<
                    keyof typeof koreanAddressData
                  >
                ).includes(selectedCity as keyof typeof koreanAddressData) &&
                koreanAddressData[
                  selectedCity as keyof typeof koreanAddressData
                ]?.map((region) => (
                  <Button
                    key={region}
                    variant={selectedRegion === region ? "default" : "outline"}
                    onClick={() => handleRegionSelect(region)}
                    className={cn(
                      "rounded-md", // Default shadcn rounded
                      selectedRegion === region
                        ? "bg-blue-600 text-white hover:bg-blue-700" // Selected style
                        : "border-gray-300 text-gray-700 hover:bg-gray-50" // Unselected style
                    )}
                  >
                    {region}
                  </Button>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

const koreanAddressData = {
  서울특별시: [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
  ],
  부산광역시: [
    "강서구",
    "금정구",
    "기장군",
    "남구",
    "동구",
    "동래구",
    "부산진구",
    "북구",
    "사상구",
    "사하구",
    "서구",
    "수영구",
    "연제구",
    "영도구",
    "중구",
    "해운대구",
  ],
  대구광역시: [
    "남구",
    "달서구",
    "달성군",
    "동구",
    "북구",
    "서구",
    "수성구",
    "중구",
  ],
  인천광역시: [
    "강화군",
    "계양구",
    "미추홀구",
    "남동구",
    "동구",
    "부평구",
    "서구",
    "연수구",
    "옹진군",
    "중구",
  ],
  광주광역시: ["광산구", "남구", "동구", "북구", "서구"],
  대전광역시: ["대덕구", "동구", "서구", "유성구", "중구"],
  울산광역시: ["남구", "동구", "북구", "울주군", "중구"],
  세종특별자치시: ["세종시"],
  경기도: [
    "가평군",
    "고양시",
    "과천시",
    "광명시",
    "광주시",
    "구리시",
    "군포시",
    "김포시",
    "남양주시",
    "동두천시",
    "부천시",
    "성남시",
    "수원시",
    "시흥시",
    "안산시",
    "안성시",
    "안양시",
    "양주시",
    "양평군",
    "여주시",
    "연천군",
    "오산시",
    "용인시",
    "의왕시",
    "의정부시",
    "이천시",
    "파주시",
    "평택시",
    "포천시",
    "하남시",
    "화성시",
  ],
  강원도: [
    "강릉시",
    "고성군",
    "동해시",
    "삼척시",
    "속초시",
    "양구군",
    "양양군",
    "영월군",
    "원주시",
    "인제군",
    "정선군",
    "철원군",
    "춘천시",
    "태백시",
    "평창군",
    "홍천군",
    "화천군",
    "횡성군",
  ],
  충청북도: [
    "괴산군",
    "단양군",
    "보은군",
    "영동군",
    "옥천군",
    "음성군",
    "제천시",
    "증평군",
    "진천군",
    "청주시",
    "충주시",
  ],
  충청남도: [
    "계룡시",
    "공주시",
    "금산군",
    "논산시",
    "당진시",
    "보령시",
    "부여군",
    "서산시",
    "서천군",
    "아산시",
    "예산군",
    "천안시",
    "청양군",
    "태안군",
    "홍성군",
  ],
  전라북도: [
    "고창군",
    "군산시",
    "김제시",
    "남원시",
    "무주군",
    "부안군",
    "순창군",
    "완주군",
    "익산시",
    "임실군",
    "장수군",
    "전주시",
    "정읍시",
    "진안군",
  ],
  전라남도: [
    "강진군",
    "고흥군",
    "곡성군",
    "광양시",
    "구례군",
    "나주시",
    "담양군",
    "목포시",
    "무안군",
    "보성군",
    "순천시",
    "신안군",
    "여수시",
    "영광군",
    "영암군",
    "완도군",
    "장성군",
    "장흥군",
    "진도군",
    "함평군",
    "해남군",
    "화순군",
  ],
  경상북도: [
    "경산시",
    "경주시",
    "고령군",
    "구미시",
    "군위군",
    "김천시",
    "문경시",
    "봉화군",
    "상주시",
    "성주군",
    "안동시",
    "영덕군",
    "영양군",
    "영주시",
    "영천시",
    "예천군",
    "울릉군",
    "울진군",
    "의성군",
    "청도군",
    "청송군",
    "칠곡군",
    "포항시",
  ],
  경상남도: [
    "거제시",
    "거창군",
    "고성군",
    "김해시",
    "남해군",
    "밀양시",
    "사천시",
    "산청군",
    "양산시",
    "의령군",
    "진주시",
    "창녕군",
    "창원시",
    "통영시",
    "하동군",
    "함안군",
    "함양군",
    "합천군",
  ],
  제주특별자치도: ["서귀포시", "제주시"],
};
