"use client";

import { ReactNode } from "react";

export default function PageWrapper({
  children
}: {
  children: ReactNode;
}) {

  return (
    <div
      style={{
        animation:
          "fadeIn 0.45s ease"
      }}
    >
      {children}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}