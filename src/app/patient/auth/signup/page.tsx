"use client";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Step1 from "./components/step-1";
import Step2 from "./components/step-2";

const formSchema = z
  .object({
    name: z.string().min(1, { message: "이름은 필수입니다." }),
    email: z.string().min(1, { message: "이메일은 필수입니다." }),
    password: z
      .string()
      .min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
    confirmPassword: z
      .string()
      .min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
    gender: z.string().min(1, { message: "성별은 필수입니다." }),
    birthdate: z.string().min(1, { message: "생년월일을 입력하세요." }),
    residence: z.string().min(1, { message: "거주가 필요합니다." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "비밀번호가 일치하지 않습니다.",
  });

const steps = [
  { label: "Personal", sub: "Info" },
  { label: "Account", sub: "Info" },
  { label: "Review" },
];

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log("Form submitted", data);
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/patient" className="cursor-pointer">
        <Image
          src="/icons/chevron-left.svg"
          alt="back"
          height={20}
          width={12}
        />
      </Link>

      <Stepper steps={steps} currentStep={currentStep} />

      <span className="font-pretendard-600 text-[20px]">
        이메일로 로그인하기
      </span>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-10"
        >
          {currentStep === 1 && <Step1 form={form} />}

          {currentStep === 2 && <Step2 form={form} />}

          {/* buttons */}

          {/* create navigation buttons here */}
          <div className="flex items-center justify-between">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                이전
              </Button>
            )}
            {currentStep < steps.length && (
              <Button
                disabled={!form.formState.isValid || loading}
                type="button"
                onClick={() => {
                  if (currentStep === 3) {
                    form.handleSubmit(onSubmit)();
                  } else {
                    setCurrentStep((prev) => prev + 1);
                  }
                }}
                className={cn(
                  "w-full",
                  !form.formState.isValid
                    ? "bg-white !text-black !opacity-100 border-1 border-black/30"
                    : "btn-primary"
                )}
                size="lg"
              >
                다음
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SignupPage;
