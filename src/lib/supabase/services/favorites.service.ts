import { supabaseClient } from "../client";

export const checkIfClinicIsFavorite = async (
  user_id: string,
  clinic_id: string
) => {
  const { data } = await supabaseClient
    .from("favorite_clinic")
    .select("id")
    .eq("clinic_id", clinic_id)
    .eq("patient_id", user_id)
    .maybeSingle();

  return {
    isFavorite: data?.id ? true : false,
    favoriteId: data?.id ? data.id : null,
  };
};

export const removeClinicFromFavorites = async (favoriteId: string) => {
  const { error } = await supabaseClient
    .from("favorite_clinic")
    .delete()
    .eq("id", favoriteId);

  if (error) {
    throw new Error(`Failed to remove favorite: ${error.message}`);
  }
};

export const addClinicToFavorites = async (
  user_id: string,
  clinic_id: string
) => {
  const { data, error } = await supabaseClient
    .from("favorite_clinic")
    .insert({
      clinic_id,
      patient_id: user_id,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to add favorite: ${error.message}`);
  }
  return data?.id || null;
};
