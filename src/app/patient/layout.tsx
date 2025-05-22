import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="max-w-[460px] min-h-screen flex flex-col  px-[20px] py-[16px] mx-auto">
      {children}
    </div>
  );
};

export default layout;
