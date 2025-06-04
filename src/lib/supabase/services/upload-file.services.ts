import { supabaseClient } from "../client";

const DEFAULT_BUCKET = "public";
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  // add more as needed
];

/**
 * Upload a single file to Supabase Storage.
 * @param file The file to upload.
 * @param options Optional: { bucket, folder, allowedMimeTypes, maxSizeMB }
 * @returns The public URL of the uploaded file.
 */
export async function uploadFileToSupabase(
  file: File,
  options?: {
    bucket?: string;
    folder?: string;
    allowedMimeTypes?: string[];
    maxSizeMB?: number;
  }
): Promise<string> {
  const bucket = options?.bucket || DEFAULT_BUCKET;
  const folder = options?.folder || "";
  const allowedMimeTypes = options?.allowedMimeTypes || ALLOWED_MIME_TYPES;
  const maxSizeMB = options?.maxSizeMB || MAX_FILE_SIZE_MB;

  // Validate file type
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error("허용되지 않는 파일 형식입니다."); // "File type not allowed."
  }

  // Validate file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.`); // "File size exceeds limit."
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`파일 업로드 실패: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!publicUrlData.publicUrl) {
    throw new Error("파일 URL 생성 실패");
  }

  return publicUrlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 * @param fileUrl The public URL or path of the file to delete.
 * @param options Optional: { bucket, folder }
 * @returns True if deleted successfully.
 */
export async function deleteFileFromSupabase(
  fileUrl: string,
  options: { bucket: string; folder?: string }
): Promise<boolean> {
  const bucket = options.bucket;

  // Extract the file path from the URL if a full URL is provided
  let filePath = fileUrl;
  if (fileUrl.startsWith("http")) {
    const url = new URL(fileUrl);
    // Supabase public URLs are usually in the format: /storage/v1/object/public/{bucket}/{path}
    const parts = url.pathname.split(`/${bucket}/`);
    if (parts.length > 1) {
      filePath = parts[1];
    } else {
      throw new Error("올바르지 않은 파일 URL입니다."); // "Invalid file URL."
    }
  }

  // If a folder is specified, ensure the path includes it
  if (options?.folder && !filePath.startsWith(options.folder)) {
    filePath = `${options.folder}/${filePath}`;
  }

  const { error } = await supabaseClient.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`파일 삭제 실패: ${error.message}`);
  }

  return true;
}
