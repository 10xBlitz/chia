"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabaseClient } from "@/lib/supabase/client";
import HeaderWithBackButton from "@/components/header-with-back-button";
import toast from "react-hot-toast";
import { registerDentist } from "@/lib/supabase/services/users.services";
import {
  DentistSignupFormSchema,
  dentistStep1Schema,
  dentistStep2Schema,
  dentistStep3Schema,
  DentistSignupFormType,
} from "./schema";
import { getPaginatedClinicDepartments } from "@/lib/supabase/services/clinic-departments.services";
import FormInput from "@/components/form-ui/form-input";
import FormSelect from "@/components/form-ui/form-select";
import FormMultiSelect from "@/components/form-ui/form-select-multi";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";
import FormGender from "@/components/form-ui/form-gender";
import FormContactNumber from "@/components/form-ui/form-contact-number";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormAddress from "@/components/form-ui/form-address";
import { Stepper } from "@/components/stepper";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { format } from "date-fns";
import { Tables } from "@/lib/supabase/types";
import {
  getClinicNotificationRecipient,
  updateClinicNotificationRecipient,
} from "@/lib/supabase/services/clinics.services";

const steps = [
  { label: "계정" }, // Account
  { label: "정보" }, // Info
  { label: "병원" }, // Clinic
  { label: "검토" }, // Review
];

export default function DentistSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isStepValid, setIsStepValid] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  // Fetch hospitals
  const { data: hospitals } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data } = await supabaseClient
        .from("clinic")
        .select("id, clinic_name")
        .filter("status", "not.eq", "deleted") // Only show active clinics
        .order("clinic_name", { ascending: true });
      return data || [];
    },
  });

  // Fetch treatments
  const { data: treatments } = useQuery({
    queryKey: ["treatments", "register-dentist"],
    queryFn: async () => {
      const result = await getPaginatedTreatments(1, 1000, {});
      return result.data || [];
    },
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getPaginatedClinicDepartments(1, 1000, {});
      return result.data || [];
    },
  });

  const form = useForm<DentistSignupFormType>({
    resolver: zodResolver(DentistSignupFormSchema),
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
      clinic_id: "",
      treatments: [],
      departments: [],
    },
  });

  const watchedValues = form.watch();

  // Step schema for validation
  const currentSchema =
    currentStep === 1
      ? dentistStep1Schema
      : currentStep === 2
      ? dentistStep2Schema
      : dentistStep3Schema;

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
    mutationFn: async (data: DentistSignupFormType) => {
      const registeredDentist = await registerDentist({
        ...data,
        birthdate: data.birthdate.toISOString(),
      });

      // Check if clinic has notification recipient, if not, set this dentist as the recipient
      const clinicNotificationRecipient = await getClinicNotificationRecipient(
        data.clinic_id
      );

      if (!clinicNotificationRecipient) {
        await updateClinicNotificationRecipient(
          data.clinic_id,
          registeredDentist.id
        );
      }
    },

    onSuccess: () => {
      toast.success("회원가입이 완료되었습니다!"); // Sign up completed successfully
      router.push("/dentist");
    },
    onError: (error) => {
      toast.error(error?.message || "회원가입에 실패했습니다."); //Failed to register.
    },
  });

  const onSubmit = (data: DentistSignupFormType) => {
    mutate(data);
  };

  const checkEmail = async (email: string) => {
    console.log("--->checkEmail: ", email);
    const res = await fetch("/api/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    const { exists } = await res.json();

    console.log("--->checkEmail response: ", exists);
    return exists;
  };

  const nextStep = async () => {
    console.log("--->next step clicked, currentStep: ", currentStep);
    //validate if email is existing already in database when in step 1
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

  console.log("---->treatments: ", treatments);

  return (
    <MobileLayout className="flex flex-col min-h-dvh overflow-x-hidden">
      <HeaderWithBackButton title="아래 정보를 입력해주세요." />
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
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.2 }}
                className="flex flex-col gap-7 flex-1"
              >
                <ReviewStep
                  form={form}
                  treatments={treatments || []}
                  departments={departments || []}
                  hospitals={hospitals || []}
                />
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
                {status === "pending" ? "회원가입 중..." : "회원가입"}{" "}
                {/* Sign Up */}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </MobileLayout>
  );
}

// Review Step Component
function ReviewStep({
  form,
  treatments,
  departments,
  hospitals,
}: {
  form: ReturnType<typeof useForm<DentistSignupFormType>>;
  treatments: Tables<"treatment">[];
  departments: Tables<"clinic_department">[];
  hospitals: { id: string; clinic_name: string }[];
}) {
  const values = form.getValues();

  // Map treatment IDs to names
  const treatmentNames =
    Array.isArray(values.treatments) && treatments
      ? values.treatments
          .map((id) => {
            const t = treatments.find((item) => item.id === id);
            return t ? t.treatment_name : id;
          })
          .join(", ")
      : "";

  // Map department IDs to names
  const departmentNames =
    Array.isArray(values.departments) && departments
      ? values.departments
          .map((id) => {
            const d = departments.find((item) => item.id === id);
            return d ? d.department_name : id;
          })
          .join(", ")
      : "";

  // Map clinic_id to clinic_name
  const clinicName =
    hospitals?.find((h) => h.id === values.clinic_id)?.clinic_name ||
    values.clinic_id ||
    "";

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
      <div className="mb-4">
        <strong className="block">병원명: {/* Clinic Name */}</strong>
        <div>{clinicName}</div>
      </div>
      <div className="mb-4">
        <strong className="block">치료: {/* Treatments */}</strong>
        <div>{treatmentNames}</div>
      </div>
      <div className="mb-4">
        <strong className="block">진료과목: {/* Departments */}</strong>
        <div>{departmentNames}</div>
      </div>
    </div>
  );
}
