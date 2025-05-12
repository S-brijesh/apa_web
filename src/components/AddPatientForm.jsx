import { useState } from 'react';
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react';

export default function AddPatientForm() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dob: '',
    email: '',
    phone: '',
    state: '',
    city: '',
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    validateField(name, formData[name]);
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateField = (name, value) => {
    let errorMessage = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errorMessage = 'Name is required';
        }
        break;
      case 'email':
        if (!value.trim()) {
          errorMessage = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
          errorMessage = 'Invalid email address';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          errorMessage = 'Phone number is required';
        } else if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
          errorMessage = 'Phone number must have 10 digits';
        }
        break;
      case 'dob':
        if (!value) {
          errorMessage = 'Date of birth is required';
        } else {
          const today = new Date();
          const birthDate = new Date(value);
          if (birthDate > today) {
            errorMessage = 'Date of birth cannot be in the future';
          }
        }
        break;
      case 'gender':
        if (!value) {
          errorMessage = 'Gender is required';
        }
        break;
      case 'state':
        if (!value) {
          errorMessage = 'State is required';
        }
        break;
      case 'city':
        if (!value.trim()) {
          errorMessage = 'City is required';
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: errorMessage }));
    return !errorMessage;
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    const fields = ['name', 'gender', 'dob', 'email', 'phone', 'state', 'city'];
    
    fields.forEach(field => {
      const valid = validateField(field, formData[field]);
      if (!valid) isValid = false;
    });
    
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Handle form submission - can connect to API endpoint
      console.log('Patient data submitted:', formData);
      // Next step logic here
    } else {
      console.log('Form has errors');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-indigo-200 bg-opacity-70 shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-6">
          <button className="text-gray-700 mr-4">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold text-center flex-grow pr-8">ADD PATIENT</h1>
        </div>

        <div>
          <div className="mb-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Name"
              className={`w-full py-2 bg-transparent border-b ${errors.name && touched.name ? 'border-red-500' : 'border-gray-400'} focus:border-indigo-600 outline-none`}
            />
            {errors.name && touched.name && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <AlertCircle size={14} className="mr-1" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full py-2 bg-transparent border-b ${errors.gender && touched.gender ? 'border-red-500' : 'border-gray-400'} focus:border-indigo-600 outline-none appearance-none`}
              >
                <option value="" disabled>Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div className="absolute right-2 top-3 pointer-events-none">
                <svg className="w-4 h-4 fill-current text-gray-600" viewBox="0 0 20 20">
                  <path d="M7 10l5 5 5-5z"></path>
                </svg>
              </div>
              {errors.gender && touched.gender && (
                <div className="flex items-center mt-1 text-red-500 text-sm">
                  <AlertCircle size={14} className="mr-1" />
                  <span>{errors.gender}</span>
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="DOB"
                className={`w-full py-2 bg-transparent border-b ${errors.dob && touched.dob ? 'border-red-500' : 'border-gray-400'} focus:border-indigo-600 outline-none`}
              />
              <div className="absolute right-2 top-2 pointer-events-none text-gray-500">
                <Calendar size={18} />
              </div>
              {errors.dob && touched.dob && (
                <div className="flex items-center mt-1 text-red-500 text-sm">
                  <AlertCircle size={14} className="mr-1" />
                  <span>{errors.dob}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Email id"
              className={`w-full py-2 bg-transparent border-b ${errors.email && touched.email ? 'border-red-500' : 'border-gray-400'} focus:border-indigo-600 outline-none`}
            />
            {errors.email && touched.email && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <AlertCircle size={14} className="mr-1" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Phone number"
              className={`w-full py-2 bg-transparent border-b ${errors.phone && touched.phone ? 'border-red-500' : 'border-gray-400'} focus:border-indigo-600 outline-none`}
            />
            {errors.phone && touched.phone && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <AlertCircle size={14} className="mr-1" />
                <span>{errors.phone}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full py-2 bg-transparent border-b ${errors.state && touched.state ? 'border-red-500' : 'border-gray-400'} focus:border-indigo-600 outline-none appearance-none`}
              >
                <option value="" disabled>State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                {/* Add more states as needed */}
              </select>
              <div className="absolute right-2 top-3 pointer-events-none">
                <svg className="w-4 h-4 fill-current text-gray-600" viewBox="0 0 20 20">
                  <path d="M7 10l5 5 5-5z"></path>
                </svg>
              </div>
              {errors.state && touched.state && (
                <div className="flex items-center mt-1 text-red-500 text-sm">
                  <AlertCircle size={14} className="mr-1" />
                  <span>{errors.state}</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="City"
                className={`w-full py-2 bg-transparent border-b ${errors.city && touched.city ? 'border-red-500' : 'border-gray-400'} focus:border-indigo-600 outline-none`}
              />
              {errors.city && touched.city && (
                <div className="flex items-center mt-1 text-red-500 text-sm">
                  <AlertCircle size={14} className="mr-1" />
                  <span>{errors.city}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}