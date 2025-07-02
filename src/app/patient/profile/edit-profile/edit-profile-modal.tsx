"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserState } from "@/stores/user-store";

import toast from "react-hot-toast";
import { updateUserProfile } from "@/lib/supabase/services/users.services";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "@/providers/user-store-provider";
import FormInput from "@/components/form-ui/form-input";
import FormContactNumber from "@/components/form-ui/form-contact-number";
import FormAddress from "@/components/form-ui/form-address";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormGender from "@/components/form-ui/form-gender";
import { editPatientProfileSchema } from "./edit-profile-schema";

export function EditProfileModal({
  open,
  onClose,
  userData,
}: {
  open: boolean;
  onClose: () => void;
  userData: UserState["user"];
}) {
  const user = userData;
  const updateUser = useUserStore((state) => state.updateUser);

  const form = useForm<z.infer<typeof editPatientProfileSchema>>({
    resolver: zodResolver(editPatientProfileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      contact_number: user?.contact_number || "",
      residence: user?.residence || "",
      birthdate: user?.birthdate ? new Date(user.birthdate) : new Date(),
      gender: user?.gender || "",
      work_place: user?.work_place || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof editPatientProfileSchema>) => {
      if (!user) throw new Error("사용자 정보가 없습니다."); // User information is missing.
      const { ...updatable } = values;
      await updateUserProfile(user.id, updatable);
      return updatable;
    },
    onSuccess: (updatable) => {
      updateUser({
        ...updatable,
        birthdate: format(updatable.birthdate, "yyyy-MM-dd"),
      });

      toast.success("정보가 성공적으로 수정되었습니다."); // Your information has been successfully updated.
      onClose();
    },
    onError: (err) => {
      console.error("Error updating profile:", err);
      toast.error("알 수 없는 오류가 발생했습니다."); // An unknown error occurred.
    },
  });

  const onSubmit = (values: z.infer<typeof editPatientProfileSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      title="정보 수정" // Edit Profile
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
          <FormInput
            control={form.control}
            name="full_name"
            label="이름" // Name
            placeholder="여기에 이름을 입력하세요" // Enter your name here
          />

          <FormContactNumber
            control={form.control}
            name="contact_number"
            label="연락처" // Contact Number
            placeholder="여기에 연락처 번호를 입력하세요" // Enter your contact number here
          />

          <FormAddress
            control={form.control}
            name="residence"
            label="주소" // Address
          />

          <FormDatePicker
            control={form.control}
            name="birthdate"
            label="생년월일" // Birthdate
          />

          <FormGender
            control={form.control}
            name="gender"
            label="성별" // Gender
          />

          <FormAddress
            control={form.control}
            name="work_place"
            label="근무지" // Workplace
          />
          <div className="flex w-full gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              취소
              {/* Cancel */}
            </Button>
            <Button
              className=" flex-1"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "수정 중..." : "수정하기"}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
