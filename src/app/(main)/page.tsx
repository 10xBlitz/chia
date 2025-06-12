"use server";

import MainPage from "./main-content";

async function Page() {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
  return <MainPage />;
}

export default Page;
