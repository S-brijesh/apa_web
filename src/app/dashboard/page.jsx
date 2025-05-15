"use client";

import { useState, useEffect } from "react";
import { User, UserPlus, Activity, Calendar, ChevronLeft } from "lucide-react";

export default function HealthDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedButton, setSelectedButton] = useState(null);

  useEffect(() => {
    setActiveTab("dashboard");
  }, []);

  const handleButtonClick = (tabName, buttonId) => {
    setActiveTab(tabName);
    setSelectedButton(buttonId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 mt-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row">
              {/* Left side - form or illustration */}
              <div className="lg:w-1/2 p-6 flex justify-center items-center relative">
                {activeTab === "add-patient" && <AddPatientForm />}
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

// Action Button Component
function ActionButton({ id, icon, text, onClick, isSelected, otherSelected }) {
  let bgColor = "bg-indigo-900";
  let hoverColor = "hover:bg-indigo-800";
  let textColor = "text-white";

  if (isSelected) {
    bgColor = "bg-indigo-900";
    hoverColor = "hover:bg-indigo-800";
  } else if (otherSelected) {
    bgColor = "bg-blue-100";
    hoverColor = "hover:bg-blue-200";
    textColor = "text-gray-800";
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

// Add Patient Form Component with validation
function AddPatientForm() {
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    state: "",
    city: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Form submitted:", formData);
      // Submit to Firebase or other backend here
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-indigo-200 bg-opacity-30 p-8 rounded-3xl shadow-lg w-full max-w-md text-white">
      <button className="mb-4">
        <ChevronLeft className="text-white" />
      </button>
      <h2 className="text-2xl font-semibold mb-6 text-center">ADD PATIENT</h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full bg-transparent border-b border-white p-2 placeholder-white"
          placeholder="Name"
        />

        <div className="flex space-x-4">
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-1/2 bg-transparent border-b border-white p-2 text-white"
          >
            <option className="text-black" value="">Gender</option>
            <option className="text-black" value="Male">Male</option>
            <option className="text-black" value="Female">Female</option>
            <option className="text-black" value="Other">Other</option>
          </select>
          <div className="w-1/2 flex items-center border-b border-white">
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="bg-transparent w-full p-2 text-white"
            />
            <Calendar className="ml-2 text-white" size={18} />
          </div>
        </div>

        <div>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-transparent border-b border-white p-2 placeholder-white"
            placeholder="Email id"
          />
          {errors.email && (
            <p className="text-red-200 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full bg-transparent border-b border-white p-2 placeholder-white"
            placeholder="Phone number"
          />
          {errors.phone && (
            <p className="text-red-200 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="flex space-x-4">
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-1/2 bg-transparent border-b border-white p-2 text-white"
          >
            <option className="text-black" value="">State</option>
            <option className="text-black" value="State A">State A</option>
            <option className="text-black" value="State B">State B</option>
          </select>
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-1/2 bg-transparent border-b border-white p-2 placeholder-white"
            placeholder="City"
          />
        </div>

        <button
          type="submit"
          className="bg-white text-indigo-900 font-semibold py-2 px-4 rounded-xl mt-4 w-full"
        >
          Next
        </button>
      </form>
    </div>
  );
}
