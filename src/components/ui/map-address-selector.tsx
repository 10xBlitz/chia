/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

interface MapAddressSelectorProps {
  control: any;
  name: string;
  label: string;
  formLabelClassName?: string;
  inputClassName?: string;
}

const MapAddressSelector: React.FC<MapAddressSelectorProps> = ({
  control,
  name,
  label,
  formLabelClassName,
  inputClassName,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [address, setAddress] = useState<string>("");

  // Reverse geocoding when marker changes
  useEffect(() => {
    const fetchAddress = async () => {
      if (!marker) return;
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${marker.lat},${marker.lng}&key=${apiKey}`
        );
        const data = await res.json();
        if (data.status === "OK" && data.results.length > 0) {
          setAddress(data.results[0].formatted_address);
        } else {
          setAddress("");
        }
      } catch (e) {
        setAddress("");
      }
    };
    fetchAddress();
  }, [marker]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={formLabelClassName}>{label}</FormLabel>
          <FormControl>
            <div>
              <Input
                readOnly
                value={address || field.value || ""}
                placeholder="지도를 클릭하여 위치를 선택하세요."
                className={inputClassName + " cursor-pointer bg-gray-50"}
                onClick={() => setModalOpen(true)}
              />
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="위치 선택"
                description="지도를 클릭하여 위치를 선택하세요."
                isLong
              >
                <APIProvider
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                >
                  <Map
                    mapId={"bf51a910020fa25a"}
                    style={{ width: "100%", height: 400 }}
                    defaultCenter={DEFAULT_CENTER}
                    defaultZoom={15}
                    onClick={(e: any) => {
                      const { latLng } = e.detail;
                      setMarker({ lat: latLng.lat, lng: latLng.lng });
                    }}
                  >
                    {marker && <AdvancedMarker position={marker} />}
                  </Map>
                </APIProvider>
                <div className="mt-4">
                  <div>
                    <b>선택된 위치:</b>
                    <span className="ml-2">
                      {address
                        ? address
                        : marker
                        ? `${marker.lat}, ${marker.lng}`
                        : "없음"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        if (marker) {
                          // Save as 'address|lat,lng' for later parsing
                          field.onChange(
                            address
                              ? `${address}|${marker.lat},${marker.lng}`
                              : `${marker.lat},${marker.lng}`
                          );
                          setModalOpen(false);
                        }
                      }}
                      disabled={!marker}
                    >
                      선택
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalOpen(false)}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default MapAddressSelector;
