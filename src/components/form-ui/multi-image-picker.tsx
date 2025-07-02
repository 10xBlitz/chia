/**
 * NOTE: This component is not used anywhere in the project. It is experimental only.
 */

import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Image from "next/image";
import { GripIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Card } from "../ui/card";
import { supabaseClient } from "@/lib/supabase/client";
import { Progress } from "../ui/progress";

// New schema type for each image
export type ImageFieldItem = {
  status: "old" | "new" | "deleted" | "updated";
  file: string | File; // string for existing (Supabase URL), File for new/updated
  oldUrl?: string;
};

type MultiImagePickerProps = {
  value: string[]; // Array of Supabase public URLs
  onChange: (images: string[]) => void;
  label?: string;
  maxImages?: number;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
  bucket: string; // Supabase bucket name
  path: string; // Supabase path prefix (e.g. user id or folder)
};

//change the client here based on your environment
const supabase = supabaseClient;

export default function MultiImagePicker({
  value = [],
  onChange,
  label = "사진 첨부 (선택)",
  maxImages = 5,
  className,
  labelClassName,
  disabled = false,
  bucket,
  path,
}: MultiImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateInputRef = useRef<HTMLInputElement>(null);
  const updateIndexRef = useRef<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Helper to update value, supporting both direct and functional updates
  const setValue = (updater: string[] | ((prev: string[]) => string[])) => {
    if (typeof updater === "function") {
      onChange(updater(value)); // always use latest value prop
    } else {
      onChange(updater);
    }
  };

  // Helper to upload a file to Supabase Storage and return the public URL
  const uploadToSupabase = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${path}/${fileName}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
      });
    if (error) {
      toast.error("이미지 업로드에 실패했습니다."); // Failed to upload image.
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Helper to remove a file from Supabase Storage
  const removeFromSupabase = async (fileUrl: string) => {
    // Extract the file path from the public URL
    const url = new URL(fileUrl);
    const filePath = decodeURIComponent(
      url.pathname.replace(`/storage/v1/object/public/${bucket}/`, "")
    );
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      toast.error("이미지 삭제에 실패했습니다."); // Failed to delete image.
    }
  };

  // Helper to fake a progress bar
  const startFakeProgress = () => {
    setIsUploading(true);
    setProgress(0);
    let value = 0;
    const interval = setInterval(() => {
      value += Math.random() * 20 + 10; // increment by 10-30%
      if (value >= 90) {
        value = 90;
        setProgress(value);
        clearInterval(interval);
      } else {
        setProgress(value);
      }
    }, 200);
    return interval;
  };
  const finishFakeProgress = (interval: NodeJS.Timeout) => {
    clearInterval(interval);
    setProgress(100);
    setTimeout(() => {
      setIsUploading(false);
      setProgress(0);
    }, 400);
  };

  // Add new images
  const handleAddImages = async (files: FileList | null) => {
    if (!files) return;
    const allowed = maxImages - value.length;
    if (files.length > allowed) {
      toast.error(`최대 ${maxImages}장까지 업로드할 수 있습니다.`);
    }
    const fileArr = Array.from(files).slice(0, allowed);
    const interval = startFakeProgress();
    // Upload all files to Supabase and get URLs
    const uploadResults = await Promise.all(fileArr.map(uploadToSupabase));
    finishFakeProgress(interval);
    const newImages: string[] = uploadResults.filter(
      (url): url is string => !!url
    );
    setValue((prev) => [...prev, ...newImages]);
  };
  // Mark image as deleted
  const handleRemoveImage = async (idx: number) => {
    const img = value[idx];
    await removeFromSupabase(img);
    const updated = value.filter((_, i) => i !== idx);
    setValue(updated);
  };
  // Update image (replace file, set status)
  const handleUpdateImage = async (idx: number, file: File) => {
    const oldUrl = value[idx];
    const interval = startFakeProgress();
    await removeFromSupabase(oldUrl);
    const url = await uploadToSupabase(file);
    finishFakeProgress(interval);
    if (!url) return;
    const updated = value.map((img, i) => (i === idx ? url : img));
    setValue(updated);
  };
  // When user clicks image, open update file input
  const onImageClick = (idx: number) => {
    updateIndexRef.current = idx;
    updateInputRef.current?.click();
  };
  // Handle drag start
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };
  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  // Handle drop
  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const reordered = [...value];
    const [removed] = reordered.splice(draggedIdx, 1);
    reordered.splice(idx, 0, removed);
    setValue(reordered);
    setDraggedIdx(null);
  };

  return (
    <div className={className}>
      {label && (
        <label
          className={cn("text-[16px] font-pretendard-600", labelClassName)}
        >
          {label}
        </label>
      )}
      {isUploading && (
        <div className="w-full mb-2">
          <Progress value={progress} max={100} />
        </div>
      )}
      <div className="flex gap-2 flex-wrap mt-2">
        {value.map((img, idx) => (
          <Card
            key={idx}
            className="relative w-20 h-20 rounded-lg overflow-hidden group cursor-pointer p-0"
            draggable={!disabled}
            onDragStart={disabled ? undefined : () => handleDragStart(idx)}
            onDragOver={disabled ? undefined : handleDragOver}
            onDrop={disabled ? undefined : () => handleDrop(idx)}
            style={{ opacity: draggedIdx === idx ? 0.5 : 1 }}
          >
            <Image
              src={img}
              alt={`quotation-img-${idx}`}
              fill
              onClick={disabled ? undefined : () => onImageClick(idx)}
              className="object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-1 right-1 bg-white/80 rounded-full p-0 w-6 h-6 min-w-0 min-h-0"
              style={{ lineHeight: 1 }}
              onClick={disabled ? undefined : () => handleRemoveImage(idx)}
              disabled={disabled}
            >
              <X size={13} />
            </Button>
            {/* Drag handle visual indicator */}
            <div className="absolute top-1 left-1 flex justify-center pointer-events-none z-10">
              <GripIcon className="text-xs bg-white/80 rounded px-1 py-0.5 w-4 h-4" />
            </div>
          </Card>
        ))}
        {value.length < maxImages && !disabled && (
          <div className="w-20 h-20 flex items-center justify-center border rounded-lg bg-gray-100 relative">
            <Button
              type="button"
              variant="ghost"
              className="w-full h-full flex flex-col items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <span className="text-2xl">+</span>
              <span className="text-xs mt-1">사진 추가</span> {/* Add photo */}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              max={maxImages}
              onChange={async (e) => {
                await handleAddImages(e.target.files);
                e.target.value = "";
              }}
              disabled={disabled}
            />
          </div>
        )}
        {/* Hidden input for updating image */}
        <Input
          ref={updateInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const idx = updateIndexRef.current;
            if (e.target.files && e.target.files[0] && idx !== null) {
              await handleUpdateImage(idx, e.target.files[0]);
            }
            updateIndexRef.current = null;
            e.target.value = "";
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
