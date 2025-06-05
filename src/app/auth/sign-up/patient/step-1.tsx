import React from "react";
import { StepInterface } from "./schema";
import FormInput from "@/components/form-ui/form-input";

const Step1: React.FC<StepInterface> = ({ form, confirmPasswordError }) => {
  return (
    <>
      <FormInput
        control={form.control}
        name="name"
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
      {confirmPasswordError && (
        <span className="text-red-500 -mt-6 ml-1">{confirmPasswordError}</span>
      )}
    </>
  );
};

export default Step1;
