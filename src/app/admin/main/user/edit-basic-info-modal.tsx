"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateUserProfile } from "@/lib/supabase/services/users.services";
import toast from "react-hot-toast";
import FormInput from "@/components/form-ui/form-input";
import FormGender from "@/components/form-ui/form-gender";
import FormAddress from "@/components/form-ui/form-address";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormContactNumber from "@/components/form-ui/form-contact-number";
import { UserColumn } from "./columns";

const formSchema = z.object({
  full_name: z.string().min(1, "이름을 입력하세요."), // Please enter a name
  contact_number: z.string().min(1, "연락처를 입력하세요."), // Please enter a contact number
  birthdate: z.date({ required_error: "생년월일을 입력하세요." }), // Please enter a birthdate
  gender: z.string().min(1, "성별을 입력하세요."), // Please enter a gender
  residence: z.string().min(1, "거주지를 입력하세요."), // Please enter a residence
  work_place: z.string().min(1, "직장을 입력하세요."), // Please enter a workplace
});

interface EditBasicInfoModalProps {
  open: boolean;
  onClose: () => void;
  user: UserColumn;
  onSuccess?: () => void;
}

export default function EditBasicInfoModal({
  open,
  onClose,
  user,
  onSuccess,
}: EditBasicInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: user.full_name || "",
      contact_number: user.contact_number || "",
      birthdate: new Date(user.birthdate) || "",
      gender: user.gender || "",
      residence: user.residence || "",
      work_place: user.work_place || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await updateUserProfile(user.id, {
        ...values,
        birthdate: new Date(values.birthdate),
      });
      toast.success("환자 정보가 수정되었습니다."); // Patient info updated
      onSuccess?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || "수정에 실패했습니다."); // Update failed
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    form.reset();
    onClose();
  };

  const inputClassName = "text-sm sm:text-[16px] h-[40px] sm:h-[45px]";
  const formLabelClassName = "text-sm sm:text-[16px]";

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="기본 정보 편집"
      description="환자의 기본 정보를 수정합니다." // Edit Basic Information
      isLong
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-2 flex flex-col"
          >
            <FormInput
              control={form.control}
              name="full_name"
              label="이름" // Name
              placeholder="이름을 입력하세요."
              disabled={loading}
              inputClassName={inputClassName}
              formLabelClassName={formLabelClassName}
            />
            <FormContactNumber
              control={form.control}
              name="contact_number"
              label="연락처" // Contact Number
              placeholder="연락처를 입력하세요."
              formLabelClassName={formLabelClassName}
              inputClassName={"!min-h-[40px] !max-h-[40px] sm:!min-h-[45px]"}
            />
            <FormDatePicker
              control={form.control}
              name="birthdate"
              label="생년월일" // Birthdate
              disabled={loading}
              formLabelClassName={formLabelClassName}
              inputClassName={"!min-h-[40px] !max-h-[40px] sm:!min-h-[45px]"}
            />
            <FormGender
              control={form.control}
              name="gender"
              label="성별" // Gender
              placeholder="성별 선택"
              disabled={loading}
              formLabelClassName={formLabelClassName}
              inputClassName={"!min-h-[40px] !max-h-[40px] sm:!min-h-[45px]"}
            />
            <FormAddress
              control={form.control}
              name="residence"
              label="거주지" // Residence
              formLabelClassName={formLabelClassName}
              inputClassName={"!min-h-[40px] !max-h-[40px] sm:!min-h-[45px]"}
            />
            <FormAddress
              control={form.control}
              name="work_place"
              label="직장" // Workplace
              formLabelClassName={formLabelClassName}
              inputClassName={"!min-h-[40px] !max-h-[40px] sm:!min-h-[45px]"}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-1/2"
              >
                취소 {/* Cancel */}
              </Button>
              <Button type="submit" disabled={loading} className="w-1/2">
                저장 {/* Save */}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
}
