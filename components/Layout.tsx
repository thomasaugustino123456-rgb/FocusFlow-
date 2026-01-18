
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <main className="flex-1 w-full pt-4">
        {children}
      </main>
    </div>
  );
};
