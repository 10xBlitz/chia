// src/components/pages/home-page.tsx
"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import FormInput from "@/components/form-ui/form-input";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "비밀번호는 최소 8자 이상이어야 합니다." }) // Password must be at least 8 characters
      .max(64, { message: "비밀번호는 64자 이하여야 합니다." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.", // Passwords do not match
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const SettingsClient = () => {
  const [loading, setLoading] = useState(false);
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });
  const { control, handleSubmit, reset } = form;

  // Supabase Auth 비밀번호 업데이트 함수 (Update user password in Supabase Auth)
  const onSubmit = async (values: PasswordFormValues) => {
    setLoading(true);
    const { error } = await supabaseClient.auth.updateUser({
      password: values.password,
    });
    setLoading(false);
    if (error) {
      toast.error("비밀번호 변경에 실패했습니다."); // Failed to update password.
    } else {
      toast.success("비밀번호가 성공적으로 변경되었습니다."); // Password updated successfully.
      reset();
    }
  };

  return (
    <div className="py-12 px-4 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        비밀번호 변경 {/* Change Password */}
      </h2>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormInput
            control={control}
            name="password"
            label="새 비밀번호" // New Password
            placeholder="새 비밀번호를 입력하세요" // Enter new password
            type="password"
            disabled={loading}
            inputClassName="bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <FormInput
            control={control}
            name="confirmPassword"
            label="비밀번호 확인" // Confirm Password
            placeholder="비밀번호를 다시 입력하세요" // Re-enter password
            type="password"
            disabled={loading}
            inputClassName="bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="pt-2">
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "변경 중..." : "비밀번호 변경"} {/* Change Password */}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SettingsClient;
