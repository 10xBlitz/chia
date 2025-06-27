import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddressSearch } from "@/hooks/useAddressSearch";
import { Search } from "lucide-react";
import React, { useRef, useState } from "react";
// import { toast } from "sonner";
import { Alert, AlertDescription } from "./ui/alert";

interface AddressSearchProps {
  id?: string;
  onAddressSelect?: (fullAddress: string, city: string, region: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  defaultValue?: string;
  placeholder?: string;
  buttonText?: string;
  className?: string;
  readOnly?: boolean;
  showValidation?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AddressSearch = ({
  id,
  onAddressSelect,
  defaultValue = "",
  placeholder,
  buttonText,
  className = "",
  readOnly = false,
  showValidation = false,
  onBlur,
  onSubmit,
  onChange,
}: AddressSearchProps) => {
  // Single source of truth for the input value
  const [inputValue, setInputValue] = useState(defaultValue);
  const isFromAddressSearchRef = useRef(false);
  const isEnglish = false;

  const onUpdateAddress = ({
    fullAddress,
    city,
    region,
  }: {
    fullAddress: string;
    city: string;
    region: string;
  }) => {
    // Add validation check before updating
    // Check for Jeju first
    // if (
    //   newAddress.includes("제주") ||
    //   newAddress.toLowerCase().includes("jeju")
    // ) {
    //   const message = isEnglish
    //     ? "Delivery to Jeju Island is not available"
    //     : "제주도는 배송이 불가능합니다";
    //   toast(message);
    //   return;
    // }
    isFromAddressSearchRef.current = true;
    setInputValue(fullAddress || "");

    if (onAddressSelect) {
      onAddressSelect(fullAddress, city, region);
      const inputElement = document.getElementById(id || "");
      if (inputElement) {
        inputElement.blur();
      }
    }
    //Reset the flag after a brief delay
    setTimeout(() => {
      isFromAddressSearchRef.current = false;
    }, 100);
  };

  const {
    openAddressSearch,
    isLoaded,
    error,
    isValidLocation,
    isJejuOrRemoteIsland,
  } = useAddressSearch({
    onAddressSelect: onUpdateAddress,
  });

  // Default placeholders with translations
  const defaultPlaceholder = isEnglish
    ? "Search for address"
    : "주소를 검색하세요";
  const defaultButtonText = isEnglish ? "Search Address" : "주소 검색";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Don't update if this change came from address search
    if (isFromAddressSearchRef.current) return;

    setInputValue(newValue);

    // Call parent onChange if provided
    if (onChange) onChange(e);

    // Notify parent if address is cleared
    if (newValue === "" && onAddressSelect) {
      onAddressSelect("", "", "");
    }
  };

  const handleAddressSearch = () => {
    openAddressSearch();
  };

  // Validation message
  const getLocationMessage = () => {
    if (isJejuOrRemoteIsland) {
      return isEnglish
        ? "Delivery to Jeju Island and remote islands is not available"
        : "제주도 및 도서 지역은 배송이 불가능합니다";
    }
    return isEnglish
      ? "This location is not available for delivery"
      : "이 지역은 배송이 불가능합니다";
  };

  const validLocationMessage = isEnglish
    ? "This address is in Seoul or Gyeonggi. Early morning delivery is available."
    : "서울 또는 경기 지역입니다. 새벽배송이 가능합니다.";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex gap-2">
        <Input
          id={id}
          value={inputValue}
          type="text"
          onChange={handleInputChange}
          placeholder={placeholder || defaultPlaceholder}
          className="flex-1 min-h-[45px]"
          readOnly={readOnly}
          onBlur={onBlur}
          onKeyUp={(e) => {
            if (e.key === "Enter" && onSubmit) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        <Button
          onClick={handleAddressSearch}
          type="button"
          disabled={!isLoaded}
        >
          <Search className="h-4 w-4 mr-2" />
          {buttonText || defaultButtonText}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {showValidation && inputValue && isValidLocation !== null && (
        <Alert
          className={
            isValidLocation
              ? "bg-green-50 border-green-200"
              : "bg-amber-50 border-amber-200"
          }
        >
          <AlertDescription
            className={isValidLocation ? "text-green-700" : "text-amber-700"}
          >
            {isValidLocation ? validLocationMessage : getLocationMessage()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AddressSearch;
