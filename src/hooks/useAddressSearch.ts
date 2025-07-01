/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    daum: any;
  }
}

interface UseAddressSearchProps {
  onAddressSelect?: ({
    fullAddress,
    city,
    region,
  }: {
    fullAddress: string;
    city: string;
    region: string;
  }) => void;
}

// Daum Postcode API result type
export interface DaumPostcodeData {
  address: string;
  addressEnglish: string;
  addressType: "R" | "J";
  apartment: "Y" | "N";
  autoJibunAddress: string;
  autoJibunAddressEnglish: string;
  autoRoadAddress: string;
  autoRoadAddressEnglish: string;
  bcode: string;
  bname: string;
  bname1: string;
  bname2: string;
  buildingCode: string;
  buildingName: string;
  hname: string;
  jibunAddress: string;
  jibunAddressEnglish: string;
  noSelected: string;
  postcode: string;
  postcode1: string;
  postcode2: string;
  postcodeSeq: string;
  roadAddress: string;
  roadAddressEnglish: string;
  roadname: string;
  roadnameCode: string;
  sido: string;
  sigungu: string;
  sigunguCode: string;
  userLanguageType: string;
  zonecode: string;
  query: string;
  [key: string]: any;
}

export const useAddressSearch = (props: UseAddressSearchProps = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidLocation, setIsValidLocation] = useState<boolean | null>(null);
  const [isJejuOrRemoteIsland, setIsJejuOrRemoteIsland] =
    useState<boolean>(false);
  const addressRef = useRef<string | null>(null);
  // const { t } = useLanguage();

  // Load the Daum Postcode script
  useEffect(() => {
    // Skip if the script is already loaded
    if (document.getElementById("daum-postcode-script")) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.id = "daum-postcode-script";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError("Failed to load Daum address API");

    document.head.appendChild(script);

    return () => {
      // Cleanup only if we added the script
      const loadedScript = document.getElementById("daum-postcode-script");
      if (loadedScript && loadedScript.parentNode) {
        loadedScript.parentNode.removeChild(loadedScript);
      }
    };
  }, []);

  // Validate if address is in Seoul or Gyeonggi, or in Jeju
  const validateLocation = useCallback((addressToValidate: string) => {
    if (!addressToValidate || addressToValidate.trim() === "") {
      setIsValidLocation(null);
      setIsJejuOrRemoteIsland(false);
      return false;
    }

    // Check for Jeju or remote islands first
    const isJejuIsland =
      addressToValidate.includes("제주") ||
      addressToValidate.toLowerCase().includes("jeju");

    const isRemoteIsland =
      addressToValidate.includes("울릉도") ||
      addressToValidate.includes("독도") ||
      addressToValidate.toLowerCase().includes("ulleung") ||
      addressToValidate.toLowerCase().includes("dokdo");

    // Set the Jeju/remote island flag
    setIsJejuOrRemoteIsland(isJejuIsland || isRemoteIsland);

    // If it's Jeju or a remote island, it's not valid for any delivery
    if (isJejuIsland || isRemoteIsland) {
      setIsValidLocation(false);
      return false;
    }

    // Check for Korean and English names for Seoul and Gyeonggi
    const isSeoul =
      addressToValidate.includes("서울") ||
      addressToValidate.toLowerCase().includes("seoul");

    const isGyeonggi =
      addressToValidate.includes("경기") ||
      addressToValidate.toLowerCase().includes("gyeonggi");

    const isValid = isSeoul || isGyeonggi;
    console.log("Address validation:", addressToValidate, isValid);
    setIsValidLocation(isValid);
    return isValid;
  }, []);

  // Custom address setter that also performs validation
  // const handleSetAddress = useCallback((newAddress: string | null) => {
  //   // Only update if actually different to prevent unnecessary re-renders
  //   if (newAddress !== addressRef.current) {

  //     log("Updating address:", newAddress);

  //     addressRef.current = newAddress;
  //     setAddress(newAddress);
  //     props.onAddressSelect?.(newAddress || '');

  //     if (newAddress && newAddress.trim() !== '') {
  //       const isValid = validateLocation(newAddress);

  //     } else if (isJejuOrRemoteIsland) {
  //       // Show error message for Jeju/remote islands
  //       setError(t("address.jejuNotAvailable") || "제주도 및 도서 지역은 배송이 불가능합니다");
  //       return;
  //     } else {
  //       setIsValidLocation(null);
  //       setIsJejuOrRemoteIsland(false);
  //     }
  //   }
  // }, [validateLocation]);

  const handleSetAddress = useCallback(
    (
      fullAddress: string | null,
      city: string | null,
      region: string | null
    ) => {
      if (fullAddress !== addressRef.current) {
        console.log("Updating address:", fullAddress);

        // Validate immediately
        if (fullAddress && fullAddress.trim() !== "") {
          // const isJeju =
          //   newAddress.includes("제주") ||
          //   newAddress.toLowerCase().includes("jeju");
          // const isUlleung =
          //   newAddress.includes("울릉도") ||
          //   newAddress.toLowerCase().includes("ulleung");
          // const isDokdo =
          //   newAddress.includes("독도") ||
          //   newAddress.toLowerCase().includes("dokdo");
          // const isRemoteIsland = isUlleung || isDokdo;
          // if (isJeju) {
          //   setIsJejuOrRemoteIsland(true);
          //   setIsValidLocation(false);
          //   setError("제주도는 배송이 불가능합니다");
          //   return; // Don't update address if it's Jeju
          // }
          // if (isRemoteIsland) {
          //   setIsJejuOrRemoteIsland(true);
          //   setIsValidLocation(false);
          //   setError("울릉도 및 독도는 배송이 불가능합니다");
          //   return; // Don't update address if it's remote island
          // }
          // validateLocation(fullAddress);
        }

        if (!fullAddress || !city || !region) {
          return;
        }

        // Only proceed if not Jeju
        addressRef.current = fullAddress;
        setAddress(fullAddress);
        props.onAddressSelect?.({ fullAddress, city, region });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validateLocation]
  );

  const openAddressSearch = useCallback(() => {
    if (!isLoaded) {
      setError("아직 로드되지 않았습니다"); // "Not loaded yet"
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: DaumPostcodeData) {
        // Get the full address
        let fullAddress = data.address;
        let extraAddress = "";

        // Handle additional address details
        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress += extraAddress
              ? `, ${data.buildingName}`
              : data.buildingName;
          }
          fullAddress += extraAddress ? ` (${extraAddress})` : "";
        }
        console.log("---->Selected address:", {
          fullAddress,
          sido: data.sido, //city
          sigungu: data.sigungu, //region
        });

        handleSetAddress(fullAddress, data.sido, data.sigungu);
      },
      onclose: function (state: string) {
        // Handle popup close
        if (state === "FORCE_CLOSE") {
          // setError("해당 지역은 배송이 불가능합니다"); // "This area is not available for delivery"
        } else if (state === "COMPLETE_CLOSE") {
          // Normal close after selection, don't set error
        }
      },
    }).open();
  }, [isLoaded, handleSetAddress]);

  return {
    openAddressSearch,
    address,
    setAddress: handleSetAddress,
    isLoaded,
    error,
    isValidLocation,
    isJejuOrRemoteIsland,
    validateLocation,
  };
};
