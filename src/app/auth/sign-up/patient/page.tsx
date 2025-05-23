"use client";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Step1 from "./step-1";
import Step2 from "./step-2";
import { fullSchema, step1Schema, step2Schema } from "./schema";
import { AnimatePresence, motion } from "framer-motion";
import Step3 from "./step-3";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const steps = [
  { label: "계정" }, // Account
  { label: "개인 정보" }, // Personal
  { label: "검토" }, // Review
];

const SignupPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isStepValid, setIsStepValid] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof fullSchema>>({
    resolver: zodResolver(fullSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
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
  }, [watchedValues, currentStep]);

  const onSubmit = async (data: z.infer<typeof fullSchema>) => {
    try {
      const { data: authUser, error } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      // Insert user profile into 'user' table after successful signup
      const { data: insertData, error: insertError } = await supabaseClient
        .from("user")
        .insert([
          {
            id: authUser.user?.id as string,
            full_name: data.name,
            gender: data.gender,
            birthdate: data.birthdate.toISOString(),
            residence: data.residence,
            work_place: data.workplace,
            role: "patient",
            contact_number: data.contact_number,
          },
        ])
        .select();
      if (insertError) throw insertError;

      toast.success("회원가입이 완료되었습니다."); //Sign up completed.
      console.log("User profile inserted:", insertData);

      router.push("/patient/home");
      //(Sign up completed successfully)
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === "User already registered") {
          toast.error("이미 가입된 이메일입니다."); //User already registered
        } else {
          toast.error(`회원가입에 실패했습니다: ${error?.message} `); //Sign up failed
        }
      }

      //(Sign up failed)
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setDirection("next");
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setDirection("prev");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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
  return (
    <div className="flex flex-col gap-6 flex-1 overflow-x-hidden max-w-[460px] px-[20px] py-[16px] mx-auto">
      <Link href="/patient" className="cursor-pointer">
        <Image
          src="/icons/chevron-left.svg"
          alt="back"
          height={20}
          width={12}
        />
      </Link>

      <div className="flex items-center mt-3 justify-center w-full">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      <span className="font-pretendard-600 mt-4 text-[20px]">
        이메일로 로그인하기
      </span>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-10 flex-1"
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
                disabled={isLoading}
                className="w-[49%] btn-primary"
              >
                {isLoading ? "회원가입 중..." : "회원가입"} {/* Sign Up */}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SignupPage;
