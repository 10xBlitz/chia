"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import HeaderWithBackButton from "@/components/header-with-back-button";
import toast from "react-hot-toast";
import { registerDentist } from "@/lib/supabase/services/users.services";
import { DentistSignupFormSchema } from "./schema";
import { getClinicDepartments } from "@/lib/supabase/services/clinic-departments.services";
import FormInput from "@/components/form-ui/form-input";
import FormSelect from "@/components/form-ui/form-select";
import FormMultiSelect from "@/components/form-ui/form-select-multi";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";

export default function DentistSignupPage() {
  const router = useRouter();

  // Fetch hospitals
  const { data: hospitals } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data } = await supabaseClient
        .from("clinic")
        .select("id, clinic_name")
        .order("clinic_name", { ascending: true });
      return data || [];
    },
  });

  // Fetch treatments
  const { data: treatments } = useQuery({
    queryKey: ["treatments"],
    queryFn: async () => {
      const result = await getPaginatedTreatments(1, 1000, {});
      return result.data;
    },
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getClinicDepartments(1, 1000, {});
      return result.data || [];
    },
  });

  const form = useForm<z.infer<typeof DentistSignupFormSchema>>({
    resolver: zodResolver(DentistSignupFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      clinic_id: "",
      treatments: [],
      departments: [],
    },
  });

  const { mutate, status } = useMutation({
    mutationFn: async (data: z.infer<typeof DentistSignupFormSchema>) => {
      await registerDentist(data);
    },
    onSuccess: () => {
      toast.success("회원가입이 완료되었습니다!"); // Sign up completed successfully
      router.push("/dentist");
    },
    onError: (error) => {
      console.log("---->error: ", error);
      toast.error(error?.message || "회원가입에 실패했습니다."); //Failed to register.
    },
  });

  const onSubmit = (data: z.infer<typeof DentistSignupFormSchema>) => {
    mutate(data);
    // console.log("---->data: ", data);
  };

  return (
    <div className="flex flex-col min-h-dvh px-4 pt-6 pb-2 bg-white max-w-lg mx-auto">
      {/* 아래 정보를 입력해주세요. (Please enter the information below.) */}
      <HeaderWithBackButton title="아래 정보를 입력해주세요." />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-7 flex-1"
        >
          <FormInput
            control={form.control}
            name="full_name"
            label="이름" //Name
            placeholder="이름을 입력해주세요." //Please enter your name
          />

          <FormInput
            control={form.control}
            name="email"
            type="email"
            label="이메일 주소" //Email address
            placeholder="이름을 입력해주세요." //Please enter your email address.
          />

          <FormInput
            control={form.control}
            name="password"
            label="비밀번호" //Password
            type="password"
            placeholder="비밀번호 (최소 6자리 이상 입력)." //Password (enter at least 6 characters)
          />

          <FormInput
            control={form.control}
            name="confirmPassword"
            label="비밀번호" //Verify password
            type="password"
            placeholder="비밀번호 (최소 6자리 이상 입력)." //Password (enter at least 6 characters)
          />

          <FormSelect
            control={form.control}
            name="clinic_id"
            label="병원명" // Hospital Name
            placeholder="병원명을 입력해주세요." // Please select hospital
          >
            {hospitals?.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.clinic_name}
              </SelectItem>
            ))}
          </FormSelect>

          {treatments && Array.isArray(treatments) && (
            <FormMultiSelect
              control={form.control}
              name="treatments"
              label="치료" // Treatment
              placeholder="여기에서 치료를 선택하세요" // Select treatments here
              options={treatments?.map((item) => ({
                label: item.treatment_name,
                value: item.id,
              }))}
              loading={!treatments}
              onChange={(selected) => {
                form.setValue(
                  "treatments",
                  selected.map((item) => item.value),
                  { shouldValidate: true }
                );
              }}
            />
          )}

          <FormMultiSelect
            control={form.control}
            name="departments"
            label="진료과목" // Departments
            placeholder="여기에서 부서를 선택하세요" // Select departments here
            options={departments?.map((item) => ({
              label: item.department_name,
              value: item.id,
            }))}
            loading={!departments}
            onChange={(e) =>
              form.setValue(
                "departments",
                e.map((item) => item.value),
                { shouldValidate: true }
              )
            }
          />

          <Button
            type="submit"
            className="h-[45px] rounded-md btn-primary"
            disabled={status === "pending"}
          >
            {/*Submit */}
            {status === "pending" ? "회원가입 중..." : "회원가입"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
