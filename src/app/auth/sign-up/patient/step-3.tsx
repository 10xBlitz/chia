import React from "react";
import { StepInterface } from "./schema";

const Step3: React.FC<StepInterface> = ({ form }) => {
  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="mb-4">
        <strong className="block">이름: {/* Name */}</strong>
        <div>{form.getValues("name")}</div>
      </div>
      <div className="mb-4">
        <strong className="block">이메일: {/* Email */}</strong>
        <div>{form.getValues("email")}</div>
      </div>
      <div className="mb-4">
        <strong className="block">성별: {/* Gender */}</strong>
        <div>{form.getValues("gender")}</div>
      </div>
      <div className="mb-4">
        <strong className="block">연락처: {/* Contact Number */}</strong>
        <div>{form.getValues("contact_number")}</div>
      </div>
      <div className="mb-4">
        <strong className="block">생년월일: {/* Birthdate */}</strong>
        <div>
          {form.getValues("birthdate")
            ? new Date(form.getValues("birthdate")).toLocaleDateString()
            : ""}
        </div>
      </div>
      <div className="mb-4">
        <strong className="block">거주지: {/* Residence */}</strong>
        <div>{form.getValues("residence")}</div>
      </div>
      <div className="mb-4">
        <strong className="block">직장: {/* Workplace */}</strong>
        <div>{form.getValues("workplace")}</div>
      </div>
    </div>
  );
};

export default Step3;
