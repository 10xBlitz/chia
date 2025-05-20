import { UserTable, columns } from "./columns";
import { DataTable } from "./data-table";

async function getData(): Promise<UserTable[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      name: "joseph",
      status: "rejected",
      email: "m@example.com",
      amount: 1200,
    },
    {
      id: "732nt52f",
      name: "paul",
      status: "approved",
      email: "a@example.com",
      amount: 9999,
    },
    // ...
  ];
}
export default async function Page() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
