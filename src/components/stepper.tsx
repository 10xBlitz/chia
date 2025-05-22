"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const Stepper = ({
  steps,
  currentStep,
}: {
  steps: { label: string; sub?: string }[];
  currentStep: number;
}) => {
  return (
    <ol className="flex font-retendard-600 items-center justify-between w-full p-3 space-x-2 text-md font-medium text-center text-gray-500 rounded-lg dark:text-gray-400 sm:text-base dark:bg-gray-800 sm:p-4 sm:space-x-4 rtl:space-x-reverse">
      {steps.map((step, index) => {
        const isActive = index + 1 === currentStep;
        return (
          <motion.li
            key={index}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex items-center",
              isActive && "text-blue-600 dark:text-blue-500"
            )}
          >
            <motion.span
              layoutId={`step-circle-${index}`}
              className={cn(
                "flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0",
                isActive
                  ? "border-blue-600 dark:border-blue-500"
                  : "border-gray-500 dark:border-gray-400"
              )}
              initial={{ scale: 0.8 }}
              animate={{ scale: isActive ? 1.2 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {index + 1}
            </motion.span>

            {step.label}
            {step.sub && (
              <span className="hidden sm:inline-flex sm:ms-2">{step.sub}</span>
            )}

            {index < steps.length - 1 && (
              <svg
                className="w-3 h-3 ms-2 ml-3 sm:ms-4 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 12 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m7 9 4-4-4-4M1 9l4-4-4-4"
                />
              </svg>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
};
