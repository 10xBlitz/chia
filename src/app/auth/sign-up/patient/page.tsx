"use client";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Step1 from "./step-1";
import Step2 from "./step-2";
import { fullSchema, step1Schema, step2Schema } from "./schema";
import { AnimatePresence, motion } from "framer-motion";
import Step3 from "./step-3";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/lib/supabase/services/users.services";
import MobileLayout from "@/components/layout/mobile-layout";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { useUserStore } from "@/providers/user-store-provider";

const steps = [
  { label: "계정" }, // Account
  { label: "개인 정보" }, // Personal
  { label: "검토" }, // Review
];

const SignupPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Set currentStep from search params, default to 1
  const stepParam = Number(searchParams.get("step")) || 1;
  const [currentStep, setCurrentStep] = useState(stepParam);
  const [isStepValid, setIsStepValid] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  const user = useUserStore((state) => state.user);

  const form = useForm<z.infer<typeof fullSchema>>({
    resolver: zodResolver(fullSchema),
    mode: "onChange",
    defaultValues: {
      name: user?.full_name || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
      gender: "",
      birthdate: new Date(),
      residence: "",
    },
  });

  const currentSchema = currentStep === 1 ? step1Schema : step2Schema;
  const watchedValues = form.watch();

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

  // useMutation for registerUser
  const { mutate, status } = useMutation({
    mutationFn: async (data: z.infer<typeof fullSchema>) => {
      // Map form data to registerUser input
      return registerUser({
        ...data,
        birthdate: data.birthdate.toISOString(),
        role: "patient",
        full_name: data.name,
        clinic_id: null,
        work_place: data.workplace,
      });
    },
    onSuccess: () => {
      toast.success("회원가입이 완료되었습니다!"); // Sign up completed successfully
      router.push("/");
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes("already registered")) {
          toast.error("이미 등록된 이메일입니다. 다른 이메일을 사용해주세요."); // Email already registered
        } else {
          toast.error(error?.message || "회원가입에 실패했습니다.");
        }
      }
    },
  });

  const onSubmit = (data: z.infer<typeof fullSchema>) => {
    mutate(data);
  };

  const nextStep = () => {
    setDirection("next");
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setDirection("prev");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Keep step in search params in sync with currentStep
  useEffect(() => {
    if (searchParams.get("step") !== String(currentStep)) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("step", String(currentStep));
      router.replace(`?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

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
    <MobileLayout className="flex flex-col gap-6 overflow-x-hidden">
      <HeaderWithBackButton title="이메일로 로그인하기" />{" "}
      {/**Login with email */}
      <div className="flex items-center mt-3 justify-center w-full">
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
                className="flex flex-col gap-10 flex-1"
              >
                <Step1
                  form={form}
                  confirmPasswordError={confirmPasswordError || ""}
                />
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
                <Step2 form={form} />
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
                className="flex flex-col gap-10 flex-1"
              >
                <Step3 form={form} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-end flex-1 gap-2">
            <Button
              disabled={currentStep <= 1}
              type="button"
              className="w-[49%] btn-primary"
              onClick={prevStep}
            >
              이전 {/* Previous */}
            </Button>

            {currentStep < steps.length && (
              <Button
                type="button"
                className="w-[49%] btn-primary"
                onClick={nextStep}
                disabled={!isStepValid}
              >
                다음 {/* Next */}
              </Button>
            )}

            {currentStep === steps.length && (
              <Button
                type="submit"
                disabled={status === "pending"}
                className="w-[49%] btn-primary"
              >
                {status === "pending" ? "회원가입 중..." : "회원가입"}{" "}
                {/* Sign Up */}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </MobileLayout>
  );
};

export default SignupPage;
