// src/components/pages/home-page.tsx
"use client";

import { useUserStore } from "@/providers/user-store-provider";

const SettingsClient = () => {
  const id = useUserStore((state) => state.user?.id);
  const email = useUserStore((state) => state.user?.email);

  // const updateUser = useUserStore((state) => state.updateUser);

  // useEffect(() => {
  //   updateUser({ id: "1234567890", email: "sample@email.com" });
  // }, []);
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
