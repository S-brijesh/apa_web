"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, UserPlus, Activity, Calendar, ChevronLeft, ChevronDown } from "lucide-react";

export default function HealthDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  useEffect(() => {
    // This ensures the activeTab is correctly set after hydration
    setActiveTab("dashboard");
  }, []);
  const [selectedButton, setSelectedButton] = useState(null);

  // Function to handle button clicks
  const handleButtonClick = (tabName, buttonId) => {
    setActiveTab(tabName);
    setSelectedButton(buttonId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Dashboard */}
        <main className="flex-1 overflow-y-auto p-6 mt-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row">
              {/* Left side - either illustration or add patient form */}
              <div className="lg:w-1/2 p-6 flex justify-center items-center relative">
                
              </div>

              {/* Right side action buttons */}
              <div className="lg:w-1/2 p-6 space-y-4">
                <ActionButton
                  id="tests-button"
                  icon={<Activity className="h-10 w-10 text-white" />}
                  text="Record a new test"
                  isSelected={selectedButton === "tests-button"}
                  otherSelected={selectedButton !== null && selectedButton !== "tests-button"}
                  onClick={() => handleButtonClick("tests", "tests-button")}
                />

                <ActionButton
                  id="add-patient-button"
                  icon={<UserPlus className="h-10 w-10 text-white" />}
                  text="Add patient"
                  isSelected={selectedButton === "add-patient-button"}
                  otherSelected={selectedButton !== null && selectedButton !== "add-patient-button"}
                  onClick={() => handleButtonClick("add-patient", "add-patient-button")}
                />

                <ActionButton
                  id="patients-button"
                  icon={<User className="h-10 w-10 text-white" />}
                  text="Patients"
                  isSelected={selectedButton === "patients-button"}
                  otherSelected={selectedButton !== null && selectedButton !== "patients-button"}
                  onClick={() => handleButtonClick("patients", "patients-button")}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Component for action buttons
function ActionButton({ id, icon, text, onClick, isSelected, otherSelected }) {
  // Determine button background color based on state
  let bgColor = "bg-indigo-900";
  let hoverColor = "hover:bg-indigo-800";
  let textColor = "text-white";
  
  if (isSelected) {
    // Keep the clicked button dark blue
    bgColor = "bg-indigo-900";
    hoverColor = "hover:bg-indigo-800";
  } else if (otherSelected) {
    // Change other buttons to #cdddff (light blue)
    bgColor = "bg-blue-100"; // This is close to #cdddff
    hoverColor = "hover:bg-blue-200";
    textColor = "text-gray-800"; // Darker text for better contrast on light background
  }

  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex items-center w-full p-6 ${bgColor} ${textColor} rounded-lg ${hoverColor} transition-colors`}
      style={otherSelected && !isSelected ? { backgroundColor: "#cdddff" } : {}}
    >
      <div className="mr-6">{icon}</div>
      <span className="text-lg font-medium">{text}</span>
    </button>
  );
}