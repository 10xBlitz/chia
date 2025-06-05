import { StepInterface } from "./schema";
import FormGender from "@/components/form-ui/form-gender";
import FormContactNumber from "@/components/form-ui/form-contact-number";
import FormBirthdate from "@/components/form-ui/form-birthdate";
import FormAddress from "@/components/form-ui/form-address";

const Step2: React.FC<StepInterface> = ({ form }) => {
  return (
    <>
      <FormGender
        control={form.control}
        name="gender"
        label="성별" //Gender
      />

      <FormContactNumber
        control={form.control}
        name="contact_number"
        label="연락처" //Contact Number
        defaultCountry="KR" // Default country set to South Korea
      />

      <FormBirthdate
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
        name="workplace"
        label="직장" // Workplace
      />
    </>
  );
};

export default Step2;
