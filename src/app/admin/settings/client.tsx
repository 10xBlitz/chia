// src/components/pages/home-page.tsx
"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { useEffect } from "react";

const SettingsClient = () => {
  const id = useUserStore((state) => state.id);
  const email = useUserStore((state) => state.email);

  const updateEmailAndId = useUserStore((state) => state.updateEmailAndId);

  console.log({ id, email });
  useEffect(() => {
    updateEmailAndId("test-id", "test-email@example.com");
  }, []);
  return (
    <div>
      <h2>User Info</h2>
      <ul>
        <li>
          <strong>ID:</strong> {id}
        </li>
        <li>
          <strong>Email:</strong> {email}
        </li>
      </ul>
    </div>
  );
};

export default SettingsClient;
