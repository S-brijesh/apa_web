"use client";

import React, { useState, useEffect } from "react";
import { User, UserPlus, Activity } from "lucide-react";
import { db2 } from "../lib/firebase2";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
const router = useRouter();

export default function HealthDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedButton, setSelectedButton] = useState(null);
  const [formStep, setFormStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    state: "",
    city: "",
  });

  const [medicalData, setMedicalData] = useState({
    height: "",
    weight: "",
    smoke: "",
    drink: "",
    diabetes: "",
    diagnosis: "",
    symptoms: "",
    medications: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [medicalErrors, setMedicalErrors] = useState({});

  useEffect(() => {
    setActiveTab("dashboard");
  }, []);

  const handleButtonClick = (tabName, buttonId) => {
    setActiveTab(tabName);
    setSelectedButton(buttonId);
    if (tabName === "add-patient") {
      setFormStep(1);
    }
    
      

  };

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicalChange = (e) => {
    const { name, value } = e.target;
    setMedicalData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePatientInfo = () => {
    const errors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.dob) errors.dob = "Date of birth is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.phone) errors.phone = "Phone number is required";
    if (!formData.state) errors.state = "State is required";
    if (!formData.city) errors.city = "City is required";
    return errors;
  };

  const validateMedicalInfo = () => {
    const errors = {};
    if (!medicalData.height) errors.height = "Height is required";
    if (!medicalData.weight) errors.weight = "Weight is required";
    if (!medicalData.smoke) errors.smoke = "Smoking info required";
    if (!medicalData.drink) errors.drink = "Drinking info required";
    return errors;
  };

  const handleNext = () => {
    const errors = validatePatientInfo();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormStep(2);
  };

  const handleAdd = async () => {
    const errors = validateMedicalInfo();
    if (Object.keys(errors).length > 0) {
      setMedicalErrors(errors);
      return;
    }
    setMedicalErrors({});

    const fullData = {
      ...formData,
      ...medicalData,
      createdAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db2, "patients"), fullData);
      alert(`Patient added successfully!\nDocument ID: ${docRef.id}`);

      setFormData({
        name: "",
        gender: "",
        dob: "",
        email: "",
        phone: "",
        state: "",
        city: "",
      });
      setMedicalData({
        height: "",
        weight: "",
        smoke: "",
        drink: "",
        diabetes: "",
        diagnosis: "",
        symptoms: "",
        medications: "",
      });
      setFormStep(1);
      setSelectedButton(null);
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("Failed to add patient.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 mt-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-6 flex justify-center items-center relative">
                {activeTab === "add-patient" && formStep === 1 && (
                  <AddPatient
                    formData={formData}
                    handleChange={handlePatientChange}
                    handleNext={handleNext}
                    errors={formErrors}
                  />
                )}
                {activeTab === "add-patient" && formStep === 2 && (
                  <AddPatientMedical
                    medicalData={medicalData}
                    handleChange={handleMedicalChange}
                    handleAdd={handleAdd}
                    errors={medicalErrors}
                  />
                )}
              </div>

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

function AddPatient({ formData, handleChange, handleNext, errors }) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#d3d3f3]">
      <div className="bg-white bg-opacity-30 backdrop-blur-md p-8 rounded-3xl w-[90%] max-w-md shadow-xl">
        <h2 className="text-black text-center text-2xl font-semibold mb-6">ADD PATIENT</h2>
        <form className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border-b bg-transparent outline-none text-black placeholder-black"
          />
          {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}

          <div className="flex justify-between gap-4">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none"
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none"
            />
          </div>
          {errors.gender && <p className="text-red-600 text-sm">{errors.gender}</p>}
          {errors.dob && <p className="text-red-600 text-sm">{errors.dob}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email id"
            value={formData.email}
            onChange={handleChange}
            className="w-full border-b bg-transparent outline-none text-black placeholder-black"
          />
          {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}

          <input
            type="tel"
            name="phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border-b bg-transparent outline-none text-black placeholder-black"
          />
          {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}

          <div className="flex justify-between gap-4">
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none"
            >
              <option value="">State</option>
              <option value="State1">State1</option>
              <option value="State2">State2</option>
            </select>

            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent outline-none text-black placeholder-black"
            />
          </div>
          {errors.state && <p className="text-red-600 text-sm">{errors.state}</p>}
          {errors.city && <p className="text-red-600 text-sm">{errors.city}</p>}

          <button
            type="button"
            onClick={handleNext}
            className="w-full mt-6 bg-white text-[#4B4BFF] font-semibold py-2 rounded-xl shadow-md"
          >
            Next
          </button>
        </form>
      </div>
    </div>
  );
}

function AddPatientMedical({ medicalData, handleChange, handleAdd, errors }) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#d3d3f3]">
      <div className="bg-white bg-opacity-30 backdrop-blur-md p-8 rounded-3xl w-[90%] max-w-md shadow-xl">
        <h2 className="text-white text-center text-2xl font-semibold mb-6">ADD PATIENT</h2>
        <form className="space-y-4">
          <div className="flex justify-between gap-4">
            <input
              type="number"
              name="height"
              placeholder="Height (cm)"
              value={medicalData.height}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none placeholder-black"
            />
            <input
              type="number"
              name="weight"
              placeholder="Weight (kg)"
              value={medicalData.weight}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none placeholder-black"
            />
          </div>
          {errors.height && <p className="text-red-600 text-sm">{errors.height}</p>}
          {errors.weight && <p className="text-red-600 text-sm">{errors.weight}</p>}

          <div className="flex justify-between gap-4">
            <select
              name="smoke"
              value={medicalData.smoke}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none"
            >
              <option value="">Do you smoke?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

            <select
              name="drink"
              value={medicalData.drink}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none"
            >
              <option value="">Do you drink?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          {errors.smoke && <p className="text-red-600 text-sm">{errors.smoke}</p>}
          {errors.drink && <p className="text-red-600 text-sm">{errors.drink}</p>}

          <input
            type="text"
            name="diabetes"
            placeholder="Diabetes"
            value={medicalData.diabetes}
            onChange={handleChange}
            className="w-full border-b bg-transparent outline-none text-black placeholder-black"
          />

          <input
            type="text"
            name="diagnosis"
            placeholder="Any previous diagnosis?"
            value={medicalData.diagnosis}
            onChange={handleChange}
            className="w-full border-b bg-transparent outline-none text-black placeholder-black"
          />

          <div className="flex justify-between gap-4">
            <input
              type="text"
              name="symptoms"
              placeholder="Symptoms"
              value={medicalData.symptoms}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none placeholder-black"
            />

            <input
              type="text"
              name="medications"
              placeholder="Medications"
              value={medicalData.medications}
              onChange={handleChange}
              className="w-1/2 border-b bg-transparent text-black outline-none placeholder-black"
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full mt-6 bg-white text-[#4B4BFF] font-semibold py-2 rounded-xl shadow-md"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
