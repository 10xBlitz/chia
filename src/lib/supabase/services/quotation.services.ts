import { supabaseClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 10;
const BUCKET_NAME = "quotation-images";
interface CreateQuotationParams {
  treatment_id: string;
  region: string;
  name: string;
  gender: string;
  birthdate: Date;
  residence: string;
  concern?: string;
  user_id: string;
  clinic_id: string | null;
  images?: File[];
  setUploadingImageIdx?: (idx: number | null) => void;
}

export async function createQuotation({
  region,
  name,
  gender,
  birthdate,
  residence,
  concern,
  user_id,
  clinic_id,
  images = [],
  treatment_id,
  setUploadingImageIdx,
}: CreateQuotationParams) {
  const uploadedImageUrls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    setUploadingImageIdx?.(i); // set current uploading image index

    const file = images[i];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`지원하지 않는 이미지 형식입니다: ${file.type}`);
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`이미지 크기는 ${MAX_FILE_SIZE_MB}MB 이하만 허용됩니다.`);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user_id}/${fileName}`;
    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError)
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`);

    console.log("---->upload error: ", uploadError);

    const { data: publicUrlData } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    if (!publicUrlData.publicUrl) throw new Error("이미지 URL 생성 실패");
    uploadedImageUrls.push(publicUrlData.publicUrl);
  }

  setUploadingImageIdx?.(null); // reset after all uploads

  const { error: insertError } = await supabaseClient.from("quotation").insert([
    {
      region,
      name,
      gender,
      birthdate: birthdate.toISOString(),
      residence,
      concern,
      patient_id: user_id,
      clinic_id,
      image_url: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
      treatment_id,
    },
  ]);

  if (insertError) throw new Error(`견적 등록 실패: ${insertError.message}`);

  console.log("--->insert error: ", insertError);
  return { success: true };
}
