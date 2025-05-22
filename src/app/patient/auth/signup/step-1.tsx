import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React from "react";
import { StepInterface } from "./schema";

const Step1: React.FC<StepInterface> = ({ form, confirmPasswordError }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[16px] font-pretendard-600">
              이름
            </FormLabel>
            <FormControl>
              <Input
                className="h-[45px]"
                placeholder="이름을 입력해주세요."
                {...field}
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
            <FormLabel>이메일 주소</FormLabel>
            <FormControl>
              <Input
                className="h-[45px]"
                placeholder="이메일 주소를 입력해주세요."
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
            <FormLabel>비밀번호</FormLabel>
            <FormControl>
              <Input
                type="password"
                className="h-[45px]"
                placeholder="비밀번호 (최소 6자리 이상 입력)"
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
            <FormLabel>비밀번호 확인</FormLabel>
            <FormControl>
              <Input
                type="password"
                className="h-[45px]"
                placeholder="비밀번호를 확인해주세요."
                {...field}
              />
            </FormControl>
            <FormMessage />

            {confirmPasswordError && (
              <span className="text-red-500">{confirmPasswordError}</span>
            )}
          </FormItem>
        )}
      />
    </>
  );
};

export default Step1;
