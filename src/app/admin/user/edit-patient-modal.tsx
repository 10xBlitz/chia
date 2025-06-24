"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tables } from "@/lib/supabase/types";
import { updateUserProfile } from "@/lib/supabase/services/users.services";
import toast from "react-hot-toast";

const formSchema = z.object({
  full_name: z.string().min(1, "이름을 입력하세요."), // Please enter a name
  contact_number: z.string().min(1, "연락처를 입력하세요."), // Please enter a contact number
  birthdate: z.string().min(1, "생년월일을 입력하세요."), // Please enter a birthdate
  gender: z.string().min(1, "성별을 입력하세요."), // Please enter a gender
  residence: z.string().min(1, "거주지를 입력하세요."), // Please enter a residence
});

interface EditPatientModalProps {
  open: boolean;
  onClose: () => void;
  user: Tables<"user">;
  onSuccess?: () => void;
}

const GENDER_OPTIONS = [
  { value: "male", label: "남성" }, // Male
  { value: "female", label: "여성" }, // Female
];

export default function EditPatientModal({
  open,
  onClose,
  user,
  onSuccess,
}: EditPatientModalProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: user.full_name || "",
      contact_number: user.contact_number || "",
      birthdate: user.birthdate || "",
      gender: user.gender || "",
      residence: user.residence || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await updateUserProfile(user.id, {
        ...values,
        birthdate: new Date(values.birthdate),
        work_place: user.work_place || "",
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
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="환자 정보 수정" // Edit Patient Info
      description="환자 정보를 수정하세요." // Edit patient information
      isLong
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel> {/* Name */}
                  <FormControl>
                    <Input {...field} placeholder="이름을 입력하세요." />
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
                  <FormLabel>연락처</FormLabel> {/* Contact Number */}
                  <FormControl>
                    <Input {...field} placeholder="연락처를 입력하세요." />
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
                  <FormLabel>생년월일</FormLabel> {/* Birthdate */}
                  <FormControl>
                    <Input {...field} placeholder="YYYY-MM-DD" />
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
                  <FormLabel>성별</FormLabel> {/* Gender */}
                  <FormControl>
                    <select
                      {...field}
                      className="w-full border rounded h-10 px-2"
                    >
                      <option value="">성별 선택</option> {/* Select Gender */}
                      {GENDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
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
                  <FormLabel>거주지</FormLabel> {/* Residence */}
                  <FormControl>
                    <Input {...field} placeholder="거주지를 입력하세요." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                취소 {/* Cancel */}
              </Button>
              <Button type="submit">저장 {/* Save */}</Button>
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
}
