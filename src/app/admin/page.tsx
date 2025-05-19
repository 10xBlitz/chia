'use client'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminLayout from "./layout";
import { AppSidebar } from "./sidebar";

export default function Page() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/admin/user'); //default page
  }, [router]);
    
  return (
      <AdminLayout>

      <div>
        <AppSidebar/>
      </div>
      </AdminLayout>

    )
  }
  