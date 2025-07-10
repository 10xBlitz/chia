"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { UserIcon, ChevronRightIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { updateLoginStatus } from "@/lib/supabase/services/users.services";
import toast from "react-hot-toast";
import React from "react";
import {
  ReservationsIcon,
  ReviewIcon,
  QuotationIcon,
} from "@/components/icons";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDentistsByClinic,
  getClinicNotificationRecipient,
  updateClinicNotificationRecipient,
} from "@/lib/supabase/services/clinics.services";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const actions = [
  {
    href: "/dentist/reservation",
    icon: ReservationsIcon,
    label: "예약", // Reservation
  },
  {
    href: "/dentist/review",
    icon: ReviewIcon,
    label: "리뷰", // Review
  },
  {
    href: "/dentist/quotation",
    icon: QuotationIcon,
    label: "견적보기", //  Quotation View
  },
];

const editProfileLink = "/dentist/profile";
const serviceInquiryLink = "/dentist/profile/chat";
const termsOfServiceLink = "/dentist/profile/terms-of-service";

// Schema for notification recipient form
const notificationSchema = z.object({
  dentistId: z.string().min(1, "치과의사를 선택해주세요."), // Please select a dentist
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

const DentistHome = () => {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Query to get dentists in the same clinic
  const { data: dentists = [] } = useQuery({
    queryKey: ["clinic-dentists", user?.clinic_id],
    queryFn: () => getDentistsByClinic(user?.clinic_id as string),
    enabled: !!user?.clinic_id,
  });

  // React Hook Form setup
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: async () => {
      const d = await getClinicNotificationRecipient(user?.clinic_id as string);
      return {
        dentistId: d.notification_recipient_user_id || "",
      };
    },
  });

  // Mutation to update notification recipient
  const updateRecipientMutation = useMutation({
    mutationFn: (dentistId: string) =>
      updateClinicNotificationRecipient(user?.clinic_id as string, dentistId),
    onSuccess: () => {
      toast.success("알림 수신자가 업데이트되었습니다."); // Notification recipient updated
      queryClient.invalidateQueries({
        queryKey: ["clinic-notification-recipient", user?.clinic_id],
      });
    },
    onError: (error) => {
      toast.error("업데이트에 실패했습니다."); // Update failed
      console.error("Error updating notification recipient:", error);
    },
  });

  const onSubmit = (values: NotificationFormValues) => {
    updateRecipientMutation.mutate(values.dentistId);
  };

  // Separate function for withdraw membership logic
  const handleWithdrawMembership = async () => {
    if (!user?.id) return;
    await updateLoginStatus(user.id, "inactive");
    await supabaseClient.auth.signOut();
    setWithdrawModalOpen(false);
    toast.success("회원탈퇴가 완료되었습니다."); // Membership withdrawal completed successfully
    router.push("/");
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="py-4 px-5 font-bold font-pretendard-600 text-lg">
        마이 {/* My */}
      </header>
      <main className="flex-1 flex flex-col pb-20">
        {/* Profile section */}
        <section className="px-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <UserIcon />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-base">
              {user?.full_name || "김00" /* Kim 00 */}
            </div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-4 bg-[#E5E5EC] py-1 text-sm font-medium"
            onClick={() => router.push(editProfileLink)}
          >
            수정 {/* Edit */}
          </Button>
        </section>

        {/* Quick actions */}
        <section className="flex gap-3 px-5 mt-6">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex-1 flex flex-col gap-2 items-center justify-center bg-gray-50 rounded-xl py-5"
            >
              <action.icon />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </section>

        {/* Account management */}
        <section className="mt-8">
          <div className="px-5 mb-2 font-semibold text-sm">
            계정 관리 {/* Account Management */}
          </div>
          <div className="bg-white">
            <Button
              variant={"ghost"}
              onClick={async () => {
                await supabaseClient.auth.signOut();
                router.push("/");
              }}
              className="flex items-center w-full justify-between "
            >
              <span className="ml-2">로그아웃 {/* Logout */}</span>
              <ChevronRightIcon className="min-h-5 min-w-5 mr-2" />
            </Button>

            <Button
              variant={"ghost"}
              onClick={() => setWithdrawModalOpen(true)}
              className="flex items-center w-full justify-between "
            >
              <span className="ml-2">회원탈퇴 {/* Withdraw Membership */}</span>
              <ChevronRightIcon className="min-h-5 min-w-5 mr-2 text-red-400 " />
            </Button>
          </div>
        </section>

        {/* Withdraw Confirm Modal */}
        <ConfirmModal
          open={withdrawModalOpen}
          onCancel={() => setWithdrawModalOpen(false)}
          onConfirm={handleWithdrawMembership}
          title="회원탈퇴 확인" // Confirm Membership Withdrawal
          description="정말로 회원탈퇴 하시겠습니까? 탈퇴 시 계정이 비활성화됩니다." // Are you sure you want to withdraw your membership? Your account will be deactivated.
        />

        {/* Customer center */}
        <section className="mt-8">
          <div className="px-5 mb-2 font-semibold text-sm">
            고객센터 {/* Customer Center */}
          </div>
          <div className="bg-white">
            <Button
              variant={"ghost"}
              onClick={() => router.push(serviceInquiryLink)}
              className="flex items-center w-full justify-between "
            >
              <span className="ml-2">
                {" "}
                서비스 이용 문의 {/* Service Inquiry */}
              </span>
              <ChevronRightIcon className="min-h-5 min-w-5 mr-2" />
            </Button>
            <Button
              variant={"ghost"}
              onClick={() => router.push(termsOfServiceLink)}
              className="flex items-center w-full justify-between "
            >
              <span className="ml-2">이용약관 {/* Terms of Service */}</span>
              <ChevronRightIcon className="min-h-5 min-w-5 mr-2" />
            </Button>
          </div>
        </section>

        {/* Notification recipient selection */}
        <section className="mt-8 px-5">
          <div className="mb-2 font-semibold text-sm">
            알림 수신자 설정 {/* Notification Recipient Setting */}
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-xs text-gray-500 mb-2">
              진료 예약 알림을 받을 치과의사를 선택하세요.
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={form.control}
                  name="dentistId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={updateRecipientMutation.isPending}
                        >
                          <SelectTrigger className="border rounded-md w-full">
                            <SelectValue placeholder="치과의사 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {dentists.length === 0 && (
                              <SelectItem value="none" disabled>
                                등록된 치과의사가 없습니다.{" "}
                                {/* No dentists registered */}
                              </SelectItem>
                            )}
                            {dentists.map((dentist) => (
                              <SelectItem key={dentist.id} value={dentist.id}>
                                {dentist.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateRecipientMutation.isPending}
                >
                  {updateRecipientMutation.isPending ? "저장 중..." : "저장"}
                  {/* Saving... / Save */}
                </Button>
              </form>
            </Form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DentistHome;
