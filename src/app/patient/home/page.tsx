"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { create } from "zustand";

export const useCountStore = create<{
  count: number;
  actions: { addCount: () => void; subtractCount: () => void };
}>((set) => {
  return {
    count: 0,
    actions: {
      addCount: () => set((state) => ({ count: state.count + 1 })),
      subtractCount: () => set((state) => ({ count: state.count - 1 })),
    },
  };
});

const HomePage = () => {
  const count = useCountStore((state) => state.count);
  const { addCount, subtractCount } = useCountStore((state) => state.actions);
  return (
    <div>
      {count}
      <Button onClick={addCount}>add</Button>{" "}
      <Button onClick={subtractCount}>minus</Button>
      <Link href={"/patient/auth/signup"}>go</Link>
    </div>
  );
};

export default HomePage;
