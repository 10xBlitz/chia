import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import React from "react";
import { StepInterface } from "./schema";

import AddressSelector from "@/components/address-selector";
import GenderSelector from "@/components/gender-selector";
import KoreanDatePicker from "@/components/date-picker";
import { PhoneInput } from "@/components/phone-input";

const Step2: React.FC<StepInterface> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[16px] font-pretendard-600">
              성별 {/* Gender */}
            </FormLabel>
            <FormControl>
              <GenderSelector
                onValueChange={field.onChange}
                value={field.value}
                disabled={false} // Set to true if you want to disable the selector
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="contact_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[16px] font-pretendard-600">
              연락처{/* Contact Number */}
            </FormLabel>
            <FormControl>
              <PhoneInput
                defaultCountry="KR"
                onChange={field.onChange}
                value={field.value}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="birthdate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[16px] font-pretendard-600">
              생년월일 {/* Birthdate */}
            </FormLabel>
            <FormControl>
              <KoreanDatePicker field={field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="residence"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[16px] font-pretendard-600">
              거주지 {/* Residence */}
            </FormLabel>
            <FormControl>
              <AddressSelector
                onAddressSelect={(city, region) =>
                  field.onChange(`${city},${region}`)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="workplace"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[16px] font-pretendard-600">
              직장 {/* Workplace */}
            </FormLabel>
            <FormControl>
              <AddressSelector
                onAddressSelect={(city, region) =>
                  field.onChange(`${city},${region}`)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default Step2;
