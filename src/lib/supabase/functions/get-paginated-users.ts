import { supabaseClient } from "../client";

export async function getPaginatedUsers(page = 1, limit = 10) {

  if(limit > 1000){
      throw Error("limit exceeds 1000")
  }

  if(limit < 1){
      throw Error("limit must be a positive number")
  }


  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseClient
    .from('user')
    .select('*', { count: 'exact' }) // `count: 'exact'` is required to get total rows
    .order('id', { ascending: true }) // or false for DESC
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const totalPages = count ? Math.ceil(count / limit) : 1;

  return {
    data,
    totalItems: count,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}