import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { toast } from "react-hot-toast";

type FormImageUploadProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>; // e.g. "images"
  label?: string;
  maxImages?: number;
  formItemClassName?: string;
  formLabelClassName?: string;
};

export default function FormMultiImageUpload<T extends FieldValues>({
  control,
  name,
  label = "사진 첨부 (선택)",
  maxImages = 5,
  formItemClassName,
  formLabelClassName,
}: FormImageUploadProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const files: File[] = field.value?.files || [];
        const previews: string[] = field.value?.previews || [];
        const setValue = (newFiles: File[], newPreviews: string[]) => {
          field.onChange({ files: newFiles, previews: newPreviews });
        };
        const handleRemoveImage = (idx: number) => {
          setValue(
            files.filter((_, i) => i !== idx),
            previews.filter((_, i) => i !== idx)
          );
        };
        return (
          <FormItem className={formItemClassName}>
            <FormLabel
              className={cn(
                "text-[16px] font-pretendard-600",
                formLabelClassName
              )}
            >
              {label}
            </FormLabel>
            <FormControl>
              <div className="flex gap-2 flex-wrap mt-2">
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-lg overflow-hidden"
                  >
                    <Image src={src} alt={`quotation-img-${idx}`} fill />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-1 right-1 bg-white/80 rounded-full"
                      onClick={() => handleRemoveImage(idx)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                {files.length < maxImages && (
                  <div className="w-20 h-20 flex items-center justify-center border rounded-lg bg-gray-100 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-full flex flex-col items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="text-2xl">+</span>
                      <span className="text-xs mt-1">사진 추가</span>
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      max={maxImages}
                      onChange={(e) => {
                        const inputFiles = e.target.files;
                        if (!inputFiles) return;
                        const allowed = maxImages - files.length;
                        if (inputFiles.length > allowed) {
                          toast.error(
                            `최대 ${maxImages}장까지 업로드할 수 있습니다.`
                          );
                        }
                        const fileArr = Array.from(inputFiles).slice(
                          0,
                          allowed
                        );
                        const newFiles = [...files, ...fileArr];
                        const newPreviews = [...previews];
                        let loaded = 0;
                        fileArr.forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            newPreviews.push(ev.target?.result as string);
                            loaded++;
                            if (loaded === fileArr.length) {
                              setValue(newFiles, newPreviews);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                        if (fileArr.length === 0) {
                          setValue(newFiles, newPreviews);
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
