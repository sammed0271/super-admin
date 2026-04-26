// src/layout/mainLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import { useState } from "react";
// import Navbar from "./navbar";

const MainLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />

      <div className="flex-1 flex flex-col w-full">

        {/* Topbar */}
        <div className="p-3 border-b flex items-center justify-between">
          <button
            className="md:hidden"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>

          <h1 className="font-semibold">Superadmin</h1>
        </div>

        {/* Page */}
        <div className="p-4 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;