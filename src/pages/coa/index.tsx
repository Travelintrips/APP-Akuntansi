import React from "react";
import Sidebar from "@/components/Sidebar";
import COAList from "@/components/coa/COAList";

const COA: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="coa" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            Bagan Akun (Chart of Accounts)
          </h1>
          <COAList />
        </div>
      </div>
    </div>
  );
};

export default COA;
