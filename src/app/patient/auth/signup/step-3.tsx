import React from "react";
import { StepInterface } from "./schema";

const Step3: React.FC<StepInterface> = ({ form }) => {
  return (
    <div className="p-6 bg-white rounded-lg">
      {/* Sign Up Information Confirmation */}
      <div className="mb-4">
        {/* Name */}
        <strong className="block">이름:</strong>
        <div>{form.getValues("name")}</div>
      </div>
      <div className="mb-4">
        {/* Email */}
        <strong className="block">이메일:</strong>
        <div>{form.getValues("email")}</div>
      </div>
      <div className="mb-4">
        {/* Gender */}
        <strong className="block">성별:</strong>
        <div>{form.getValues("gender")}</div>
      </div>
      <div className="mb-4">
        {/* Birthdate */}
        <strong className="block">생년월일:</strong>
        <div>
          {form.getValues("birthdate")
            ? new Date(form.getValues("birthdate")).toLocaleDateString()
            : ""}
        </div>
      </div>
      <div className="mb-4">
        {/* Residence */}
        <strong className="block">거주지:</strong>
        <div>{form.getValues("residence")}</div>
      </div>
      <div className="mb-4">
        {/* Workplace */}
        <strong className="block">직장:</strong>
        <div>{form.getValues("workplace")}</div>
      </div>
    </div>
  );
};

export default Step3;
