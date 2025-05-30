"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import MultipleSelector from "@/components/ui/multiple-selector";
import HeaderWithBackButton from "@/components/header-with-back-button";
import toast from "react-hot-toast";
import { registerDentist } from "@/lib/supabase/services/users.services";
import { DentistSignupFormSchema } from "./schema";
import { getClinicDepartments } from "@/lib/supabase/services/clinic-departments.services";

export default function DentistSignupPage() {
  const router = useRouter();

  // Fetch hospitals
  const { data: hospitals, isLoading: hospitalsLoading } = useQuery({
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
  const { data: treatments, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["treatments"],
    queryFn: async () => {
      const { data } = await supabaseClient
        .from("treatment")
        .select("id, treatment_name")
        .order("treatment_name", { ascending: true });
      return data || [];
    },
  });

  // Fetch treatments
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getClinicDepartments(1, 1000, {});
      return result.data || [];
    },
  });

  console.log("---->departments", departments);

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
      router.push("/dentist/home");
    },
    onError: (error) => {
      console.log("---->error: ", error);
      toast.error(error?.message || "회원가입에 실패했습니다.");
    },
  });

  const onSubmit = (data: z.infer<typeof DentistSignupFormSchema>) => {
    mutate(data);
  };

  return (
    <div className="flex flex-col min-h-svh px-4 pt-6 pb-2 bg-white max-w-lg mx-auto">
      {/* 아래 정보를 입력해주세요. (Please enter the information below.) */}
      <HeaderWithBackButton title="아래 정보를 입력해주세요." />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-7 flex-1"
        >
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름 {/* 이름 (Name) */}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="이름을 입력해주세요." //(Please enter your name.)
                    className="h-[45px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일 주소 {/**Email address */}</FormLabel>
                <FormControl>
                  <Input
                    className="h-[45px]"
                    placeholder="이메일 주소를 입력해주세요." //Please enter your email address.
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 {/**password */}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="h-[45px]"
                    placeholder="여기에 비밀번호를 입력하세요" //Enter password here
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 확인 {/**verify password */}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="h-[45px]"
                    placeholder="비밀번호를 확인해주세요." //Please confirm your password.
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clinic_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>병원명 {/*  (Hospital Name) */}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                  disabled={hospitalsLoading}
                >
                  <FormControl>
                    <SelectTrigger className="w-full min-h-[45px]">
                      {/* 병원명을 입력해주세요. (Please select hospital.) */}
                      <SelectValue placeholder="병원명을 입력해주세요." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hospitals?.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.clinic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="treatments"
            render={() => (
              <FormItem>
                <FormLabel>치료 {/*Treatments */}</FormLabel>
                <div>
                  {treatmentsLoading ? (
                    <span className="text-gray-400 text-sm">
                      치료법을 로딩 중입니다... {/**Loading treatments... */}
                    </span>
                  ) : (
                    <MultipleSelector
                      selectFirstItem={false}
                      defaultOptions={treatments?.map((item) => ({
                        label: item.treatment_name,
                        value: item.id,
                      }))}
                      placeholder="여기에서 치료를 선택하세요" // Select treatments here
                      hidePlaceholderWhenSelected={true}
                      onChange={(e) =>
                        form.setValue(
                          "treatments",
                          e.map((item) => item.value),
                          { shouldValidate: true }
                        )
                      }
                      emptyIndicator={
                        // no results found.
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          결과가 없습니다.
                        </p>
                      }
                    />
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 진료과목 (Departments) */}
          <FormField
            control={form.control}
            name="departments"
            render={() => (
              <FormItem>
                <FormLabel>진료과목 {/**Departments */}</FormLabel>
                <div>
                  {departmentsLoading ? (
                    <span className="text-gray-400 text-sm">
                      적재 부서... {/**Loading departments... */}
                    </span>
                  ) : (
                    <MultipleSelector
                      selectFirstItem={false}
                      defaultOptions={departments?.map((item) => ({
                        label: item.department_name,
                        value: item.id,
                      }))}
                      placeholder="여기에서 부서를 선택하세요" // Select departments here
                      hidePlaceholderWhenSelected={true}
                      onChange={(e) =>
                        form.setValue(
                          "departments",
                          e.map((item) => item.value),
                          { shouldValidate: true }
                        )
                      }
                      emptyIndicator={
                        // no results found.
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          결과가 없습니다.
                        </p>
                      }
                    />
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
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
