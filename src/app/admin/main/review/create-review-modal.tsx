"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormMultiImageUpload from "@/components/form-ui/form-multi-image-upload";
import FormTextarea from "@/components/form-ui/form-textarea";
import FormStarRating from "@/components/form-ui/form-star-rating";
import {
  createReview,
  updateReview,
} from "@/lib/supabase/services/reviews.services";
import { getPaginatedClinics } from "@/lib/supabase/services/clinics.services";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
import { Database } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useUserStore } from "@/providers/user-store-provider";

const MAX_IMAGES = 10;
const MAX_TEXT = 500;

const adminReviewSchema = z.object({
  patient_name: z.string().min(1, "환자 이름을 입력해주세요."),
  clinic_id: z.string().min(1, "병원을 선택해주세요."),
  clinic_treatment_id: z.string().min(1, "시술을 선택해주세요."),
  rating: z.number().min(1, "평점을 입력해주세요.").max(5),
  review: z
    .string()
    .max(MAX_TEXT, `최대 ${MAX_TEXT}자까지 입력할 수 있습니다.`),
  images: z.array(
    z.object({
      status: z.enum(["old", "new", "deleted", "updated"]),
      file: z.union([z.string(), z.instanceof(File)]),
      oldUrl: z.string().optional(),
    })
  ),
});

type AdminReviewFormValues = z.infer<typeof adminReviewSchema>;

type ClinicRow = Database["public"]["Tables"]["clinic"]["Row"] & {
  clinic_treatment: Array<{
    id: string;
    treatment: {
      treatment_name: string;
    };
  }>;
};

type TreatmentRow = {
  id: string;
  treatment: {
    treatment_name: string;
  };
};

interface CreateReviewModalProps {
  editMode?: boolean;
  editData?: any; //eslint-disable-line @typescript-eslint/no-explicit-any
  open?: boolean;
  onClose?: () => void;
}

export default function CreateReviewModal({
  editMode = false,
  editData = null,
  open: externalOpen,
  onClose: externalOnClose,
}: CreateReviewModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);

  // Use external open state if provided, otherwise use internal
  const open = editMode ? externalOpen ?? false : internalOpen;
  const setOpen = editMode
    ? (open: boolean) => !open && externalOnClose?.()
    : setInternalOpen;

  // Fetch clinics for dropdown
  const { data: clinicsData, isLoading: clinicsLoading } = useQuery<
    ClinicRow[]
  >({
    queryKey: ["admin-clinics"],
    queryFn: async () => {
      const res = await getPaginatedClinics(1, 100);
      return res.data;
    },
  });

  // Debug editData structure
  console.log("EditData:", editData);

  const form = useForm<AdminReviewFormValues>({
    resolver: zodResolver(adminReviewSchema),
    defaultValues: {
      patient_name: editData?.name || "",
      clinic_id: "", // We'll set this after fetching clinics
      clinic_treatment_id: editData?.clinic_treatment?.id || "",
      rating: editData?.rating || 4,
      review: editData?.review || "",
      images: editData?.images
        ? editData.images.map((url: string) => ({
            status: "old",
            file: url,
          }))
        : [],
    },
  });

  // Set clinic_id when in edit mode and clinics are loaded
  useEffect(() => {
    if (editMode && editData && clinicsData && !form.getValues("clinic_id")) {
      // Find the clinic ID by matching clinic name
      const matchingClinic = clinicsData.find(
        (clinic) =>
          clinic.clinic_name === editData.clinic_treatment?.clinic?.clinic_name
      );
      if (matchingClinic) {
        console.log("Setting clinic_id:", matchingClinic.id);
        form.setValue("clinic_id", matchingClinic.id);
      }
    }
  }, [editMode, editData, clinicsData, form]);

  const selectedClinicId = form.watch("clinic_id");

  // Fetch clinic treatments when clinic is selected
  const { data: treatmentsData, isLoading: treatmentsLoading } = useQuery<
    TreatmentRow[]
  >({
    queryKey: ["clinic-treatments", selectedClinicId],
    queryFn: async () => {
      if (!selectedClinicId) return [];
      const res = await getPaginatedClinicTreatments(selectedClinicId, 1, 100);
      return res.data;
    },
    enabled: !!selectedClinicId,
  });

  // Reset clinic_treatment_id when clinic changes
  const handleClinicChange = (clinicId: string) => {
    form.setValue("clinic_id", clinicId);
    form.setValue("clinic_treatment_id", "");
  };

  const mutation = useMutation({
    mutationFn: async (values: AdminReviewFormValues) => {
      if (!user?.id) {
        throw new Error("관리자 로그인이 필요합니다.");
      }

      if (editMode && editData) {
        // Update existing review
        return updateReview({
          review_id: editData.id,
          rating: values.rating,
          review: values.review,
          clinic_treatment_id: values.clinic_treatment_id,
          patient_name: values.patient_name,
          images: values.images,
        });
      } else {
        // Create new review
        return createReview({
          rating: values.rating,
          review: values.review,
          clinic_treatment_id: values.clinic_treatment_id,
          user_id: user.id,
          images: values.images,
          patient_name: values.patient_name, // This will be stored in the name field
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editMode ? "리뷰가 수정되었습니다." : "리뷰가 등록되었습니다."
      );
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      form.reset();
      setOpen(false);
    },
    onError: (err: Error) => {
      console.log(err);
      toast.error(
        err?.message ||
          (editMode ? "리뷰 수정에 실패했습니다." : "리뷰 등록에 실패했습니다.")
      );
    },
  });

  const onSubmit = (values: AdminReviewFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editMode && (
        <DialogTrigger asChild>
          <Button className="">
            <Plus className="w-4 h-4 mr-2" />
            리뷰 추가
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "리뷰 수정" : "새 리뷰 추가"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Information */}
            <FormField
              control={form.control}
              name="patient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>환자 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="환자 이름을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Clinic Selection */}
            <FormField
              control={form.control}
              name="clinic_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>병원</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={handleClinicChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="병원을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {clinicsLoading ? (
                          <SelectItem value="loading" disabled>
                            로딩중...
                          </SelectItem>
                        ) : (
                          clinicsData?.map((clinic) => (
                            <SelectItem key={clinic.id} value={clinic.id}>
                              {clinic.clinic_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Treatment Selection */}
            <FormField
              control={form.control}
              name="clinic_treatment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시술</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedClinicId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedClinicId
                              ? "시술을 선택하세요"
                              : "먼저 병원을 선택하세요"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentsLoading ? (
                          <SelectItem value="loading" disabled>
                            로딩중...
                          </SelectItem>
                        ) : treatmentsData && treatmentsData.length > 0 ? (
                          treatmentsData.map((treatment) => (
                            <SelectItem key={treatment.id} value={treatment.id}>
                              {treatment.treatment.treatment_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-treatments" disabled>
                            이용 가능한 시술이 없습니다
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rating */}
            <FormStarRating control={form.control} name="rating" label="평점" />

            {/* Review Text */}
            <FormTextarea
              control={form.control}
              name="review"
              label="리뷰"
              maxLength={MAX_TEXT}
              placeholder="리뷰를 입력해주세요. (최대 500자)"
            />

            {/* Images */}
            <FormMultiImageUpload
              control={form.control}
              name="images"
              label="사진 첨부 (선택)"
              maxImages={MAX_IMAGES}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={mutation.status === "pending"}>
                {mutation.status === "pending"
                  ? editMode
                    ? "수정중..."
                    : "등록중..."
                  : editMode
                  ? "수정하기"
                  : "등록하기"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
