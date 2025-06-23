"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserState } from "@/stores/user-store";
import toast from "react-hot-toast";
import { updateUserPassword } from "@/lib/supabase/services/users.services";
import { useMutation } from "@tanstack/react-query";
import FormInput from "@/components/form-ui/form-input";
import { supabaseClient } from "@/lib/supabase/client";

// Zod schema for validation
const formSchema = z
  .object({
    oldPassword: z.string().min(6, "기존 비밀번호를 입력해주세요."), // Please enter your old password.
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."), // Password must be at least 6 characters long.
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.", // Passwords do not match.
    path: ["confirmPassword"],
  });

export function EditPasswordModal({
  open,
  onClose,
  userData,
}: {
  open: boolean;
  onClose: () => void;
  userData: UserState["user"];
}) {
  const user = userData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      oldPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error("사용자 정보가 없습니다."); // User information is missing.

      // 1. Re-authenticate user with old password
      const {
        data: { session },
        error: signInError,
      } = await supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: values.oldPassword,
      });
      if (signInError || !session) {
        throw new Error("기존 비밀번호가 올바르지 않습니다."); // Old password is incorrect.
      }

      // 2. Update password
      await updateUserPassword(values.password);
    },
    onSuccess: () => {
      toast.success("비밀번호가 성공적으로 수정되었습니다."); // Your password has been successfully updated.
      onClose();
    },
    onError: (err) => {
      const msg = err?.message || "알 수 없는 오류가 발생했습니다."; // An unknown error occurred.
      toast.error(msg);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      title="비밀번호 수정" // Edit Password
      description="비밀번호를 수정하려면 기존 비밀번호와 새 비밀번호를 입력해주세요." // Please enter your old and new password to change your password.
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
            name="oldPassword"
            type="password"
            label="기존 비밀번호" // Old Password
            placeholder="기존 비밀번호를 입력해주세요." // Please enter your old password.
          />
          <FormInput
            control={form.control}
            name="password"
            type="password"
            label="새 비밀번호" // New Password
            placeholder="새 비밀번호를 입력해주세요." // Please enter your new password.
          />
          <FormInput
            control={form.control}
            name="confirmPassword"
            type="password"
            label="비밀번호 확인" // Confirm Password
            placeholder="비밀번호를 다시 입력해주세요." // Please re-enter your password.
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
              className="btn-primary flex-1"
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
