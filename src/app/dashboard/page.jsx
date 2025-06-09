"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, UserPlus, Activity, ArrowLeft, Heart } from "lucide-react";
import { db2 } from "../lib/firebase2";
import Image from 'next/image';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import Link from 'next/link';
import useAuthProtection from '../../hooks/useAuthProtection';

export default function HealthDashboard() {
  const checkingAuth = useAuthProtection();

  if (checkingAuth) {
    return <div className="p-6 text-center text-white-500">Checking authentication...</div>; 
  }
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedButton, setSelectedButton] = useState(null);
  const [formStep, setFormStep] = useState(1);
  const router = useRouter();

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
    if (tabName === "patients") {
      router.push("/patient");
      return;
    }

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

  const handleBack = () => {
    setFormStep(1);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      {/* <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">HealthCare Dashboard</h1>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-12rem)]">
          
          {/* Left Side - Forms */}
          <div className="flex items-center justify-center">
            {activeTab === "dashboard" && (
              <div className="w-3/4 h-3/4 relative">
                <Image
                    src="/images/landingpageimg.png" // ✅ Ensure this image is in the public/ folder
                    alt="Landing Page Illustration"
                    layout="fill"
                    objectFit="contain"
                    priority
                />
              </div>
            )}

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
                handleBack={handleBack}
                errors={medicalErrors}
              />
            )}

            {activeTab === "tests" && (
              <div className="text-center p-8">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                  <Activity className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Record New Test</h2>
                  {/* <p className="text-gray-600">Test recording functionality will be implemented here.</p> */}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex flex-col justify-center space-y-6 p-4">
            <ActionButton
              id="tests-button"
              icon={<Activity className="h-12 w-12" />}
              text="Record a new test"
              // description="Add medical test results and reports"
              isSelected={selectedButton === "tests-button"}
              otherSelected={selectedButton !== null && selectedButton !== "tests-button"}
              onClick={() => handleButtonClick("tests", "tests-button")}
            />
            
            <ActionButton
              id="add-patient-button"
              icon={<UserPlus className="h-12 w-12" />}
              text="Add patient"
              // description="Register a new patient with medical details"
              isSelected={selectedButton === "add-patient-button"}
              otherSelected={selectedButton !== null && selectedButton !== "add-patient-button"}
              onClick={() => handleButtonClick("add-patient", "add-patient-button")}
            />
            
            <ActionButton
              id="patients-button"
              icon={<User className="h-12 w-12" />}
              text="View patients"
              // description="Browse and manage existing patients"
              isSelected={selectedButton === "patients-button"}
              otherSelected={selectedButton !== null && selectedButton !== "patients-button"}
              onClick={() => handleButtonClick("patients", "patients-button")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ id, icon, text, description, onClick, isSelected, otherSelected }) {
  const baseClasses = "group relative p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg";
  
  let buttonClasses = baseClasses;
  let iconColor = "text-white";
  let textColor = "text-white";
  let descColor = "text-white/80";

  if (isSelected) {
    buttonClasses += " bg-gradient-to-r from-indigo-600 to-purple-600 shadow-2xl";
  } else if (otherSelected) {
    buttonClasses += " bg-white hover:bg-gray-50 border border-gray-200";
    iconColor = "text-indigo-600";
    textColor = "text-gray-900";
    descColor = "text-gray-600";
  } else {
    buttonClasses += " bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800";
  }

  return (
    <button
      id={id}
      onClick={onClick}
      className={buttonClasses}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl ${isSelected ? 'bg-white/20' : otherSelected ? 'bg-indigo-50' : 'bg-white/20'}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="flex-1 text-left">
          <h3 className={`text-xl font-semibold mb-1 ${textColor}`}>{text}</h3>
          <p className={`text-sm ${descColor}`}>{description}</p>
        </div>
      </div>
    </button>
  );
}

function AddPatient({ formData, handleChange, handleNext, errors }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <UserPlus className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Add New Patient</h2>
          <p className="text-gray-600 mt-2">Enter patient information</p>
        </div>

        <div className="space-y-6 text-black">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>
            
            <div>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
              {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
            </div>
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="">Select State</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Delhi">Delhi</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Punjab">Punjab</option>
              </select>
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>
            
            <div>
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPatientMedical({ medicalData, handleChange, handleAdd, handleBack, errors }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="flex items-center mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <Activity className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Medical Information</h2>
            <p className="text-gray-600 mt-2">Complete patient medical details</p>
          </div>
        </div>

        <form className="space-y-6 text-black">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                name="height"
                placeholder="Height (cm)"
                value={medicalData.height}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
              {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
            </div>
            
            <div>
              <input
                type="number"
                name="weight"
                placeholder="Weight (kg)"
                value={medicalData.weight}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
              {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <select
                name="smoke"
                value={medicalData.smoke}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="">Do you smoke?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.smoke && <p className="text-red-500 text-sm mt-1">{errors.smoke}</p>}
            </div>

            <div>
              <select
                name="drink"
                value={medicalData.drink}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="">Do you drink?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.drink && <p className="text-red-500 text-sm mt-1">{errors.drink}</p>}
            </div>
          </div>

          <div>
            <input
              type="text"
              name="diabetes"
              placeholder="Diabetes (Type/None)"
              value={medicalData.diabetes}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div>
            <textarea
              name="diagnosis"
              placeholder="Previous diagnosis (if any)"
              value={medicalData.diagnosis}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <textarea
                name="symptoms"
                placeholder="Current symptoms"
                value={medicalData.symptoms}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
              />
            </div>
            
            <div>
              <textarea
                name="medications"
                placeholder="Current medications"
                value={medicalData.medications}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Add Patient
          </button>
        </form>
      </div>
    </div>
  );
}