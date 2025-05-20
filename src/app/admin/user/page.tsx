import { getPaginatedUsers } from "@/lib/supabase/functions/get-paginated-users";
import { columns } from "./columns";
import { DataTable } from "./data-table";

// async function getData(): Promise<UserTable[]> {
//    const { data, error, count } = await supabaseClient
//     .from('user')
//     .select('*', { count: 'exact' }) // `count: 'exact'` is required to get total rows
//     .order('id', { ascending: true }) // or false for DESC
//     .range(offset, offset + limit - 1);

//   if (error) {
//     throw error;
//   }

//   return data || [];
// }
export default async function Page({
  searchParams,
}: {
  searchParams: { page?: number; limit?: number };
}) {
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const limit = searchParams.limit ? Number(searchParams.limit) : 10;

  const data = await getPaginatedUsers(page, limit);

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data.data} currentPage={page} />
    </div>
  );
}
