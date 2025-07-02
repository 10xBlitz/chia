"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import HeaderWithBackButton from "@/components/header-with-back-button";
import toast from "react-hot-toast";
import { registerAdmin } from "@/lib/supabase/services/users.services";
import {
  AdminSignupFormSchema,
  adminStep1Schema,
  adminStep2Schema,
  AdminSignupFormType,
} from "./schema";
import FormInput from "@/components/form-ui/form-input";
import FormGender from "@/components/form-ui/form-gender";
import FormContactNumber from "@/components/form-ui/form-contact-number";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormAddress from "@/components/form-ui/form-address";
import { Stepper } from "@/components/stepper";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

const steps = [
  { label: "계정" }, // Account
  { label: "정보" }, // Info
  { label: "검토" }, // Review
];

export default function AdminSignupPage() {
  const router = useRouter();

  // --- Admin password gate state ---
  const [isAuthed, setIsAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  // --- All other hooks must be called unconditionally ---
  const [currentStep, setCurrentStep] = useState(1);
  const [isStepValid, setIsStepValid] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  const form = useForm<AdminSignupFormType>({
    resolver: zodResolver(AdminSignupFormSchema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "",
      contact_number: "",
      birthdate: new Date(),
      residence: "",
      work_place: "",
    },
  });

  const watchedValues = form.watch();

  // Step schema for validation
  const currentSchema = currentStep === 1 ? adminStep1Schema : adminStep2Schema;

  useEffect(() => {
    const validate = async () => {
      const result = currentSchema.safeParse(watchedValues);
      setIsStepValid(result.success);
    };

    if (currentStep === 1) {
      if (watchedValues.password !== watchedValues.confirmPassword) {
        setConfirmPasswordError("비밀번호가 일치하지 않습니다."); // Passwords do not match
      } else {
        setConfirmPasswordError(null);
      }
    }

    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues, currentStep]);

  const { mutate, status } = useMutation({
    mutationFn: async (data: AdminSignupFormType) => {
      await registerAdmin({
        ...data,
        birthdate: data.birthdate.toISOString(),
        adminPassword: pw, // Pass the admin password for backend validation
      });
    },
    onSuccess: () => {
      toast.success("관리자 회원가입이 완료되었습니다!"); // Admin sign up completed successfully
      router.push("/admin");
    },
    onError: (error) => {
      toast.error(error?.message || "회원가입에 실패했습니다."); //Failed to register.
    },
  });

  const onSubmit = (data: AdminSignupFormType) => {
    mutate(data);
  };

  const checkEmail = async (email: string) => {
    const res = await fetch("/api/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    const { exists } = await res.json();
    return exists;
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      const isRegistered = await checkEmail(form.getValues("email"));
      if (isRegistered) {
        toast.error("이미 등록된 이메일입니다."); // Email already registered
        return;
      }
    }
    setDirection("next");
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setDirection("prev");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Password handler
  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin-signup-auth", {
      method: "POST",
      body: JSON.stringify({ password: pw }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.success) {
      setIsAuthed(true);
    } else {
      setError(data.error || "비밀번호가 올바르지 않습니다."); // Password is incorrect
    }
  };

  // --- Render password form if not authed ---
  if (!isAuthed) {
    return (
      <form
        onSubmit={handlePwSubmit}
        className="flex flex-col gap-4 max-w-xs mx-auto mt-20"
      >
        <label htmlFor="admin-pw" className="font-bold">
          관리자 비밀번호 입력 {/* Enter admin password */}
        </label>
        <Input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />
        <Button type="submit">확인 {/* Confirm */}</Button>
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      </form>
    );
  }

  // Variants for swipe animation with directional support
  const variants = {
    enter: (dir: "next" | "prev") => ({
      x: dir === "next" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: "next" | "prev") => ({
      x: dir === "next" ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <MobileLayout className="flex flex-col min-h-dvh overflow-x-hidden">
      <HeaderWithBackButton title="관리자 정보를 입력해주세요." />
      <div className="flex items-center mt-3 mb-5 justify-center w-full">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-10 flex-1 pb-10"
        >
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            {currentStep === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.2 }}
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
                  placeholder="이메일을 입력해주세요." //Please enter your email address.
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
                  label="비밀번호 확인" //Verify password
                  type="password"
                  placeholder="비밀번호 (최소 6자리 이상 입력)." //Password (enter at least 6 characters)
                />
                {confirmPasswordError && (
                  <span className="text-red-500 -mt-6 ml-1">
                    {confirmPasswordError}
                  </span>
                )}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.2 }}
                className="flex flex-col gap-7 flex-1"
              >
                <FormGender
                  control={form.control}
                  name="gender"
                  label="성별" //Gender
                />
                <FormContactNumber
                  control={form.control}
                  name="contact_number"
                  label="연락처" //Contact Number
                  defaultCountry="KR"
                />
                <FormDatePicker
                  control={form.control}
                  name="birthdate"
                  label="생년월일" //Birthdate
                />
                <FormAddress
                  control={form.control}
                  name="residence"
                  label="거주지" // Residence
                />
                <FormAddress
                  control={form.control}
                  name="work_place"
                  label="근무지" // Workplace
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.2 }}
                className="flex flex-col gap-7 flex-1"
              >
                <AdminReviewStep form={form} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-end flex-1 gap-2">
            <Button
              disabled={currentStep <= 1}
              type="button"
              className="w-[49%]"
              onClick={prevStep}
            >
              이전 {/* Previous */}
            </Button>

            {currentStep < steps.length && (
              <Button
                type="button"
                className="w-[49%]"
                onClick={async () => await nextStep()}
                disabled={!isStepValid}
              >
                다음 {/* Next */}
              </Button>
            )}

            {currentStep === steps.length && (
              <Button
                type="submit"
                disabled={status === "pending"}
                className="w-[49%]"
              >
                {status === "pending" ? "회원가입 중..." : "관리자 회원가입"}{" "}
                {/* Admin Sign Up */}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </MobileLayout>
  );
}

// Admin Review Step Component
function AdminReviewStep({
  form,
}: {
  form: ReturnType<typeof useForm<AdminSignupFormType>>;
}) {
  const values = form.getValues();

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="mb-4">
        <strong className="block">이름: {/* Name */}</strong>
        <div>{values.full_name}</div>
      </div>
      <div className="mb-4">
        <strong className="block">이메일: {/* Email */}</strong>
        <div>{values.email}</div>
      </div>
      <div className="mb-4">
        <strong className="block">성별: {/* Gender */}</strong>
        <div>{values.gender}</div>
      </div>
      <div className="mb-4">
        <strong className="block">연락처: {/* Contact Number */}</strong>
        <div>{values.contact_number}</div>
      </div>
      <div className="mb-4">
        <strong className="block">생년월일: {/* Birthdate */}</strong>
        <div>
          {values.birthdate
            ? format(new Date(values.birthdate), "yyyy.MM.dd")
            : ""}
        </div>
      </div>
      <div className="mb-4">
        <strong className="block">거주지: {/* Residence */}</strong>
        <div>{values.residence}</div>
      </div>
      <div className="mb-4">
        <strong className="block">근무지: {/* Workplace */}</strong>
        <div>{values.work_place}</div>
      </div>
    </div>
  );
}
