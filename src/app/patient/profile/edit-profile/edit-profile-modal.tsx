"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { UserState } from "@/stores/user-store";
import { PhoneInput } from "@/components/phone-input";
import AddressSelector from "@/components/address-selector";
import { KoreanDatePicker } from "@/components/date-picker-v2";
import GenderSelector from "@/components/gender-selector";
import toast from "react-hot-toast";
import { updateUserProfile } from "@/lib/supabase/services/users.services";

// Zod schema for validation
const profileSchema = z.object({
  full_name: z.string().min(2, "이름을 2자 이상 입력해주세요."), // Name at least 2 chars
  contact_number: z.string().min(9, "연락처를 올바르게 입력해주세요."), // Simple length check
  residence: z.string({ required_error: "주소를 입력해주세요." }), //Please enter your address.
  birthdate: z.date({ required_error: "생년월일을 입력하세요." }), //Please enter your date of birth.
  gender: z.string({ required_error: "성별을 입력해주세요." }), //Please enter your gender
  work_place: z.string({ required_error: "귀하의 근무지를 입력해 주세요." }),
});

export function EditProfileModal({
  open,
  onClose,
  onUserUpdated,
  userData,
}: {
  open: boolean;
  onClose: () => void;
  userData: UserState;
  onUserUpdated: (userDataParam: Partial<UserState>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const user = userData.user;

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      contact_number: user?.contact_number || "",
      residence: user?.residence || "",
      birthdate: user?.birthdate ? new Date(user.birthdate) : new Date(),
      gender: user?.gender || "",
      work_place: user?.work_place || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) {
      throw new Error("사용자 정보가 없습니다."); // No user information available
    }
    setLoading(true);
    try {
      // Remove fields that should not be updated
      const { ...updatable } = values;
      console.log("Updating profile with values:", updatable);
      await updateUserProfile(user.id, updatable);
      console.log("Profile updated successfully", updatable);
      onUserUpdated({
        user: {
          ...user,
          ...updatable,
          birthdate: updatable.birthdate.toISOString(),
        },
      });
      setLoading(false);
      toast.success("정보가 성공적으로 수정되었습니다."); // Info updated successfully.
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Supabase error: has 'status' and 'message' fields
      if (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        "message" in err
      ) {
        // Supabase duplicate email error
        if (
          err.message?.toLowerCase().includes("already registered") ||
          err.status === 422 ||
          err.message?.toLowerCase().includes("duplicate") ||
          err.message?.toLowerCase().includes("unique constraint")
        ) {
          toast.error("이미 사용 중인 이메일입니다."); // Email already in use.
        } else {
          toast.error("정보 수정 중 오류가 발생했습니다."); // Error updating info.
        }
      } else {
        toast.error("알 수 없는 오류가 발생했습니다."); // Unknown error occurred.
      }
      setLoading(false);
    }
  };

  return (
    <Modal
      title="정보 수정" // Edit Info
      description="기본 정보를 수정합니다." // Edit your basic information.
      isOpen={open}
      isLong={true}
      onClose={onClose}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-2"
        >
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름 {/* Name */}</FormLabel>
                <FormControl>
                  <Input className="h-[45px]" {...field} />
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
                <FormLabel>연락처 {/* Contact */}</FormLabel>
                <FormControl>
                  {/* <Input {...field} /> */}
                  <PhoneInput {...field} />
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
                <FormLabel>주소 {/* Address */}</FormLabel>
                <FormControl>
                  <AddressSelector
                    onAddressSelect={(city, region) =>
                      field.onChange(`${city},${region}`)
                    }
                    initialCity={field.value.split(",")[0] || ""}
                    initialRegion={field.value.split(",")[1] || ""}
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
                <FormLabel>생년월일 {/* Birthdate */}</FormLabel>
                <FormControl>
                  <KoreanDatePicker
                    onChange={(date) => {
                      if (date) field.onChange(date);
                    }}
                    value={field.value}
                    disabled={field.disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>성별 {/* Gender */}</FormLabel>
                <FormControl>
                  <GenderSelector
                    onValueChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="work_place"
            render={({ field }) => (
              <FormItem>
                <FormLabel>직장 {/* Work Place */}</FormLabel>
                <FormControl>
                  <AddressSelector
                    onAddressSelect={(city, region) =>
                      field.onChange(`${city},${region}`)
                    }
                    initialCity={field.value.split(",")[0] || ""}
                    initialRegion={field.value.split(",")[1] || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex w-full gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              취소 {/* Cancel */}
            </Button>
            <Button
              className="btn-primary flex-1"
              type="submit"
              disabled={loading}
            >
              {loading ? "수정 중..." : "수정하기"} {/* Update */}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
