"use client";
import { format } from "date-fns";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { registerKakaoUser } from "@/lib/supabase/services/users.services";
import MobileLayout from "@/components/layout/mobile-layout";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { useUserStore } from "@/providers/user-store-provider";
import FormInput from "@/components/form-ui/form-input";
import FormContactNumber from "@/components/form-ui/form-contact-number";
import FormGender from "@/components/form-ui/form-gender";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormAddress from "@/components/form-ui/form-address";
import { supabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

// Kakao signup schema (no password fields, name/email required, rest editable)
const kakaoSignupSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  email: z.string().email("유효한 이메일을 입력해주세요."),
  contact_number: z.string().min(1, "연락처를 입력해주세요."),
  gender: z.string().min(1, "성별을 선택해주세요."),
  birthdate: z.union([z.string().min(1, "생년월일을 입력해주세요."), z.date()]),
  residence: z.string().min(1, "거주지를 입력해주세요."),
  workplace: z.string().min(1, "근무지를 입력해주세요."),
});

const steps = [
  { label: "개인 정보" }, // Personal
  { label: "검토" }, // Review
];

const FinishOAuthSignup = () => {
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const [currentStep, setCurrentStep] = useState(1); // Step 1: Form, Step 2: Review
  const [isStepValid, setIsStepValid] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const router = useRouter();

  // Use the kakaoSignupSchema for compatibility with local steps
  const form = useForm<z.infer<typeof kakaoSignupSchema>>({
    resolver: zodResolver(kakaoSignupSchema),
    mode: "onChange",
    defaultValues: {
      name: user?.full_name || "",
      email: user?.email ?? "",
      contact_number: "",
      gender: "",
      birthdate: new Date(),
      residence: "",
      workplace: "",
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    // Only validate kakaoSignupSchema fields
    const result = kakaoSignupSchema.safeParse(watchedValues);
    setIsStepValid(result.success);
  }, [watchedValues]);

  // useMutation for registerUser
  const { mutate, status } = useMutation({
    mutationFn: async (data: z.infer<typeof kakaoSignupSchema>) => {
      return registerKakaoUser({
        ...data,
        birthdate:
          typeof data.birthdate === "string"
            ? data.birthdate
            : data.birthdate.toDateString(),
        role: "patient",
        full_name: data.name,
        clinic_id: null,
        work_place: data.workplace,
        email: user?.email ?? "",
        contact_number: data.contact_number,
        id: user?.id ?? "", // use Supabase Auth user id
      });
    },
    onSuccess: (newUser) => {
      // Update zustand user store with new user data
      updateUser(newUser.data);
      // Sign up completed successfully
      toast.success("회원가입이 완료되었습니다!"); // Sign up completed successfully
      router.push("/");
    },
    onError: (error) => {
      console.error("회원가입 오류:", error);
      if (error instanceof Error) {
        // 회원가입에 실패했습니다.
      }
    },
  });

  const onSubmit = (data: z.infer<typeof kakaoSignupSchema>) => {
    mutate(data);
  };

  const nextStep = () => {
    setDirection("next");
    setCurrentStep(2);
  };

  const prevStep = () => {
    setDirection("prev");
    setCurrentStep(1);
  };

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

  // Handle browser back button - redirect to login when user leaves
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      (async () => {
        await supabaseClient.auth.signOut();
        router.push("/auth/login");
      })();
    };

    // Push initial state to enable popstate detection
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  // Redirect if already registered
  useEffect(() => {
    if (user && (user.work_place || user.residence)) {
      router.replace("/");
    }
  }, [user, router]);

  //if user has no email show message and button to redirect to login
  if (!user?.email) {
    return (
      <MobileLayout className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg font-semibold py-20">
          이 페이지에 접근할 수 없습니다.{" "}
          {/* Please complete your signup with your Kakao account. */}
        </div>
        <Button
          onClick={() => {
            supabaseClient.auth.signOut().then(() => {
              router.push("/auth/login");
            });
          }}
          className="w-1/2 bg-red-500 hover:bg-red-600"
        >
          로그인 페이지로 이동 {/* Go to Login Page */}
        </Button>
      </MobileLayout>
    );
  }

  // Early return: do not render anything while zustand is still checking user (user === undefined)
  if (typeof user === "undefined") return null;

  // Early return: show loading UI while checking user (user === null)
  if (user === null) {
    return (
      <MobileLayout className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg font-semibold py-20">
          로그인 중입니다... {/* Logging in... */}
        </div>
      </MobileLayout>
    );
  }

  if (user.work_place || user.residence) return null;

  return (
    <MobileLayout className="flex flex-col gap-6 overflow-x-hidden">
      <HeaderWithBackButton title="카카오 회원가입 완료" />
      <div className="flex items-center mt-3 justify-center w-full">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          className="!justify-center !gap-20"
        />
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
                className="flex flex-col gap-10 flex-1"
              >
                <KakaoStep1 form={form} />
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
                className="flex flex-col gap-10 flex-1"
              >
                <KakaoStep2 form={form} />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Navigation buttons */}
          <div className="flex items-end flex-1 gap-2">
            <Button
              disabled={currentStep === 1}
              type="button"
              className="w-[49%]"
              onClick={prevStep}
            >
              이전 {/* Previous */}
            </Button>
            {currentStep === 1 && (
              <Button
                type="button"
                className="w-[49%]"
                onClick={nextStep}
                disabled={!isStepValid}
              >
                다음 {/* Next */}
              </Button>
            )}
            {currentStep === 2 && (
              <Button
                type="submit"
                disabled={status === "pending"}
                className="w-[49%]"
              >
                {status === "pending" ? "회원가입 중..." : "회원가입"}{" "}
                {/* Sign Up */}
              </Button>
            )}
          </div>

          <Button
            type="button"
            disabled={status === "pending"}
            className="w-full bg-red-500 hover:bg-red-600 -mt-5"
            onClick={() =>
              supabaseClient.auth.signOut().then(() => {
                router.push("/auth/login");
              })
            } // Sign out and redirect to login
          >
            등록 취소 {/* Cancel Registration */}
          </Button>
        </form>
      </Form>
    </MobileLayout>
  );
};

function KakaoStep1({
  form,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof kakaoSignupSchema>>>;
}) {
  // Only show name/email as readonly, and other fields as editable
  return (
    <div className="flex flex-col gap-6">
      {/* 이름 (Name) - readonly */}
      <FormInput
        control={form.control}
        name="name"
        label="이름" // Name
        placeholder="이름을 입력해주세요" // Please enter your name
      />
      {/* 이메일 (Email) - readonly */}
      <FormInput
        control={form.control}
        name="email"
        label="이메일" // Email
        placeholder="이메일을 입력해주세요" // Please enter your email
        disabled
      />
      {/* 연락처 (Contact Number) */}
      <FormContactNumber
        control={form.control}
        name="contact_number"
        label="연락처" // Contact Number
        placeholder="연락처를 입력해주세요" // Please enter your contact number
      />
      {/* 성별 (Gender) */}
      <FormGender
        control={form.control}
        name="gender"
        label="성별" // Gender
      />
      {/* 생년월일 (Birthdate) */}
      <FormDatePicker
        control={form.control}
        name="birthdate"
        label="생년월일" // Birthdate
      />
      {/* 거주지 (Residence) */}
      <FormAddress
        control={form.control}
        name="residence"
        label="거주지" // Residence
      />
      {/* 근무지 (Workplace) */}
      <FormAddress
        control={form.control}
        name="workplace"
        label="근무지" // Workplace
      />
    </div>
  );
}
function KakaoStep2({
  form,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof kakaoSignupSchema>>>;
}) {
  // Simple review step
  const values = form.getValues();
  return (
    <div className="flex flex-col gap-4">
      <div>이름: {values.name}</div>
      <div>이메일: {values.email}</div>
      <div>연락처: {values.contact_number}</div>
      <div>성별: {values.gender}</div>
      <div>
        생년월일:{" "}
        {values.birthdate instanceof Date
          ? format(values.birthdate, "yyyy년 MM월 dd일")
          : values.birthdate}
      </div>
      <div>거주지: {values.residence}</div>
      <div>근무지: {values.workplace}</div>
    </div>
  );
}

export default FinishOAuthSignup;
