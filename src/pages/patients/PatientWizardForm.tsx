import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Save, ArrowLeft, ArrowRight } from 'lucide-react';
import WizardFormStep from '../../components/patients/WizardFormStep';
import WizardProgressBar from '../../components/patients/WizardProgressBar';
import SendFormModal, { SendFormData } from '../../components/forms/SendFormModal';

// Interfaces from original PatientForm
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface Attorney {
  name: string;
  firm: string;
  phone: string;
  email: string;
  caseNumber?: string;
  address: Omit<Address, 'country'>;
}

interface Patient {
  _id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  status: string;
  visits?: Array<{
    _id: string;
    visitType: string;
    status: string;
    date: string;
  }>;
  assignedDoctor: string;
  attorney?: Attorney;
  address: Address;
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  subjective: {
    fullName: string;
    date: string;
    physical: string[];
    sleep: string[];
    cognitive: string[];
    digestive: string[];
    emotional: string[];
    bodyPart: { part: string; side: string }[];
    severity: string;
    quality: string[];
    timing: string;
    context: string;
    exacerbatedBy: string[];
    symptoms: string[];
    notes: string;
    radiatingTo: string;
    radiatingRight: boolean;
    radiatingLeft: boolean;
    sciaticaRight: boolean;
    sciaticaLeft: boolean;
    tempBodyPart?: string;
    tempSide?: string;
  };
  // New fields for the wizard form
  formType?: 'self' | 'other';
  guardianInfo?: {
    name: string;
    relationship: string;
  };
  preferredLanguage?: 'english' | 'spanish' | 'other';
  translationHelp?: boolean;
  referralInfo?: {
    isReferred: boolean;
    referredBy?: string;
  };
  governmentIdUploaded?: boolean;
  insuranceCardUploaded?: boolean;
  autoInsuranceUploaded?: boolean;
  communicationPreferences?: {
    email: boolean;
    phone: boolean;
    text: boolean;
    mail: boolean;
  };
  isNewProblem?: boolean;
  dominantHand?: 'left' | 'right' | 'ambidextrous';
  hobbies?: string;
  injuryExplanation?: string;
  consentSignature?: string;
  consentDate?: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
}

const PatientWizardForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const isEditMode = !!id;
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSendFormModal, setShowSendFormModal] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bodyParts, setBodyParts] = useState<Array<{part: string, side: string}>>([{part: '', side: ''}]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Patient>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    email: '',
    status: 'active',
    assignedDoctor: user?.role === 'admin' ? '' : user?._id || '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    medicalHistory: {
      allergies: [''],
      medications: [''],
      conditions: [''],
      surgeries: [''],
      familyHistory: ['']
    },
    subjective: {
      fullName: '',
      date: new Date().toISOString().split('T')[0],
      physical: [],
      sleep: [],
      cognitive: [],
      digestive: [],
      emotional: [],
      bodyPart: [],
      severity: '',
      quality: [],
      timing: '',
      context: '',
      exacerbatedBy: [],
      symptoms: [],
      notes: '',
      radiatingTo: '',
      radiatingRight: false,
      radiatingLeft: false,
      sciaticaRight: false,
      sciaticaLeft: false
    },
    attorney: {
      name: '',
      firm: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    },
    // New wizard form fields with defaults
    formType: 'self',
    preferredLanguage: 'english',
    translationHelp: false,
    referralInfo: {
      isReferred: false
    },
    governmentIdUploaded: false,
    insuranceCardUploaded: false,
    autoInsuranceUploaded: false,
    communicationPreferences: {
      email: true,
      phone: false,
      text: false,
      mail: false
    },
    isNewProblem: true,
    dominantHand: 'right'
  });

  // Define wizard steps with translations
  const wizardStepsEnglish = [
    'Introduction',
    'Referral',
    'Personal Info',
    'Address',
    'Insurance',
    'Attorney',
    'Medical History',
    'Visit Details',
    'Subjective Intake',
    'Reports',
    'Communication',
    'Review'
  ];

  const wizardStepsSpanish = [
    'Introducción',
    'Referencia',
    'Información Personal',
    'Dirección',
    'Seguro',
    'Abogado',
    'Historial Médico',
    'Detalles de Visita',
    'Ingesta Subjetiva',
    'Informes',
    'Comunicación',
    'Revisión'
  ];
  
  // Use the appropriate language based on preference
  const wizardSteps = formData.preferredLanguage === 'spanish' ? wizardStepsSpanish : wizardStepsEnglish;

  // Handle body part changes (from original form)
  const handleAddBodyPart = () => {
    setBodyParts([...bodyParts, {part: '', side: ''}]);
  };

  const handleRemoveBodyPart = (index: number) => {
    if (bodyParts.length > 1) {
      const updated = [...bodyParts];
      updated.splice(index, 1);
      setBodyParts(updated);
    }
  };

  const handleBodyPartChange = (index: number, field: 'part' | 'side', value: string) => {
    const updated = [...bodyParts];
    updated[index] = { ...updated[index], [field]: value };
    setBodyParts(updated);
  
    setFormData(prev => ({
      ...prev,
      subjective: {
        ...prev.subjective,
        bodyPart: updated
      }
    }));
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isEditMode) {
          // Fetch existing patient data
          const patientResponse = await axios.get(`http://localhost:5000/api/patients/${id}`);
          const patientData = patientResponse.data;
  
          if (patientData.dateOfBirth) {
            patientData.dateOfBirth = new Date(patientData.dateOfBirth).toISOString().split('T')[0];
          }
  
          // Ensure subjective structure
          if (!patientData.subjective) {
            patientData.subjective = {
              fullName: '',
              date: '',
              physical: [],
              sleep: [],
              cognitive: [],
              digestive: [],
              emotional: [],
              bodyPart: [],
              severity: '',
              quality: [],
              timing: '',
              context: '',
              exacerbatedBy: [],
              symptoms: [],
              notes: '',
              radiatingTo: '',
              radiatingRight: false,
              radiatingLeft: false,
              sciaticaRight: false,
              sciaticaLeft: false
            };
          }
  
          setFormData(patientData);
        } else {
          // Auto-generate caseNumber in create mode using localStorage
          const lastCase = localStorage.getItem("lastCaseNumber") || "1000";
          const newCaseNumber = parseInt(lastCase) + 1;
          localStorage.setItem("lastCaseNumber", newCaseNumber.toString());
  
          setFormData(prev => ({
            ...prev,
            attorney: {
              ...prev.attorney,
              caseNumber: `CASE-${newCaseNumber}`
            }
          }));
        }
  
        // Fetch doctor list if user is admin
        if (user?.role === 'admin') {
          const doctorsResponse = await axios.get('http://localhost:5000/api/auth/doctors');
          setDoctors(doctorsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [id, isEditMode, user?.role]);

  // Form change handlers (from original form)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const isCheckbox = type === 'checkbox';
    const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => {
      // Create a deep copy of the previous state
      const newState = JSON.parse(JSON.stringify(prev));
      
      // Handle nested properties (e.g., attorney.address.street)
      if (name.includes('.')) {
        const parts = name.split('.');
        let current = newState;
        
        // Traverse the object path
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== 'object') {
            // Initialize the nested object if it doesn't exist
            current[part] = {};
          }
          current = current[part];
        }
        
        // Set the value at the final path
        const lastPart = parts[parts.length - 1];
        current[lastPart] = inputValue;
      } else {
        // Handle top-level properties
        newState[name] = inputValue;
      }
      
      return newState;
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleArrayChange = (category: string, index: number, value: string) => {
    const updatedArray = [...formData.medicalHistory[category as keyof typeof formData.medicalHistory] as string[]];
    updatedArray[index] = value;
    
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [category]: updatedArray
      }
    }));
  };

  const addArrayItem = (category: string) => {
    const updatedArray = [...formData.medicalHistory[category as keyof typeof formData.medicalHistory] as string[], ''];
    
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [category]: updatedArray
      }
    }));
  };

  const removeArrayItem = (category: string, index: number) => {
    const updatedArray = [...formData.medicalHistory[category as keyof typeof formData.medicalHistory] as string[]];
    updatedArray.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [category]: updatedArray
      }
    }));
  };

  // Wizard navigation functions
  const goToNextStep = () => {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, wizardSteps.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  const goToStep = (stepIndex: number) => {
    // Only allow going to a step if all previous steps are valid
    let canNavigate = true;
    for (let i = 0; i < stepIndex; i++) {
      if (!validateStep(i)) {
        canNavigate = false;
        break;
      }
    }

    if (canNavigate) {
      setCurrentStep(stepIndex);
      window.scrollTo(0, 0);
    }
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Introduction
        // No validation needed for language preference
        return true;

      case 1: // Referral
        // No required fields
        return true;

      case 2: // Personal Info
        if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.email?.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.assignedDoctor) newErrors.assignedDoctor = 'Please assign a doctor';
        break;

      case 3: // Address
        // Address fields are optional
        return true;

      case 4: // Insurance
        // Insurance uploads are optional
        return true;

      case 5: // Attorney
        // Attorney info is optional
        return true;

      case 6: // Medical History
        // Medical history is optional
        return true;

      case 7: // Visit Details
        // Visit details are optional
        return true;

      case 8: // Subjective Intake
        // Subjective intake is optional
        return true;

      case 9: // Reports
        // Reports are optional
        return true;

      case 10: // Communication
        // At least one communication preference should be selected
        if (!formData.communicationPreferences?.email && 
            !formData.communicationPreferences?.phone && 
            !formData.communicationPreferences?.text && 
            !formData.communicationPreferences?.mail) {
          newErrors.communicationPreferences = 'Please select at least one communication method';
        }
        break;

      case 11: // Review
        // Final validation before submission
        if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.email?.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.assignedDoctor) newErrors.assignedDoctor = 'Please assign a doctor';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentStep = (): boolean => {
    return validateStep(currentStep);
  };

  // Helper function to clean and validate form data (from original form)
  const preparePatientData = (data: Patient) => {
    // Create a deep copy of the data
    const cleanedData: any = JSON.parse(JSON.stringify(data));
    
    // Format date of birth
    if (cleanedData.dateOfBirth) {
      cleanedData.dateOfBirth = new Date(cleanedData.dateOfBirth).toISOString();
    }
    
    // Clean medical history arrays
    if (cleanedData.medicalHistory) {
      cleanedData.medicalHistory = Object.fromEntries(
        Object.entries(cleanedData.medicalHistory).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.filter((item: string) => item && item.trim() !== '') : value
        ])
      );
    }
    
    // Clean subjective data
    if (cleanedData.subjective) {
      cleanedData.subjective = {
        ...cleanedData.subjective,
        bodyPart: Array.isArray(cleanedData.subjective.bodyPart)
          ? cleanedData.subjective.bodyPart.filter(
              (bp: { part: string; side: string }) =>
                bp.part && bp.side && bp.part.trim() !== '' && bp.side.trim() !== ''
            )
          : []
      };
    }
    
    // Clean attorney info
    if (cleanedData.attorney) {
      const hasAttorneyInfo = [
        cleanedData.attorney.name,
        cleanedData.attorney.firm,
        cleanedData.attorney.phone,
        cleanedData.attorney.email,
        cleanedData.attorney.caseNumber
      ].some((val) => val && val.trim() !== '');
      
      if (!hasAttorneyInfo) {
        delete cleanedData.attorney;
      } else {
        // Clean attorney address
        if (cleanedData.attorney.address) {
          const hasAddressInfo = Object.values(cleanedData.attorney.address).some(
            (val: any) => val && val.trim() !== ''
          );
          
          if (!hasAddressInfo) {
            delete cleanedData.attorney.address;
          } else {
            // Remove empty address fields
            cleanedData.attorney.address = Object.fromEntries(
              Object.entries(cleanedData.attorney.address)
                .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            );
          }
        }
      }
    }
    
    return cleanedData;
  };

  // Form submission handler (from original form with modifications)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps before submission
    let isValid = true;
    for (let i = 0; i < wizardSteps.length; i++) {
      if (!validateStep(i)) {
        isValid = false;
        setCurrentStep(i);
        break;
      }
    }
    
    if (!isValid) {
      window.scrollTo(0, 0);
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare and clean patient data
      const patientData = preparePatientData(formData);
      
      // Add required fields that might be missing
      if (!patientData.status) {
        patientData.status = 'Active'; // Default status
      }
      
      // Ensure required nested objects exist
      if (!patientData.address) patientData.address = {} as Address;
      if (!patientData.medicalHistory) patientData.medicalHistory = { allergies: [], medications: [], conditions: [], surgeries: [], familyHistory: [] };
      if (!patientData.subjective) patientData.subjective = {
        fullName: '',
        date: new Date().toISOString().split('T')[0],
        physical: [],
        sleep: [],
        cognitive: [],
        digestive: [],
        emotional: [],
        bodyPart: [],
        severity: '',
        quality: [],
        timing: '',
        context: '',
        exacerbatedBy: [],
        symptoms: [],
        notes: '',
        radiatingTo: '',
        radiatingRight: false,
        radiatingLeft: false,
        sciaticaRight: false,
        sciaticaLeft: false
      };
      
      const config = { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };
      
      console.log('Sending patient data:', JSON.stringify(patientData, null, 2));
      
      try {
        const response = isEditMode 
          ? await axios.put(`http://localhost:5000/api/patients/${id}`, patientData, config)
          : await axios.post('http://localhost:5000/api/patients', patientData, config);
        
        console.log('Server response:', response.data);
        
        // Show success message
        alert(`Patient ${isEditMode ? 'updated' : 'created'} successfully!`);
        
        // Redirect to patients list
        navigate('/patients');
      } catch (axiosError: any) {
        // Handle axios errors
        console.error('Axios error details:', {
          message: axiosError.message,
          code: axiosError.code,
          config: axiosError.config,
          response: axiosError.response ? {
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            data: axiosError.response.data,
            headers: axiosError.response.headers
          } : 'No response',
          request: axiosError.request ? 'Request made but no response received' : 'No request made'
        });
        
        throw axiosError; // Re-throw to be caught by the outer catch
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      
      let errorMessage = 'Failed to save patient. Please try again.';
      let errorDetails = '';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // Try to extract more detailed error information
        const responseData = error.response.data;
        
        if (typeof responseData === 'string') {
          // If the response is a string, try to parse it as JSON
          try {
            const parsedData = JSON.parse(responseData);
            errorMessage = parsedData.message || errorMessage;
            errorDetails = parsedData.error || JSON.stringify(parsedData, null, 2);
          } catch (e) {
            // If it's not JSON, use the raw response
            errorMessage = responseData || errorMessage;
          }
        } else if (responseData && typeof responseData === 'object') {
          errorMessage = responseData.message || errorMessage;
          errorDetails = responseData.error || JSON.stringify(responseData, null, 2);
        }
        
        // Add status-specific messages
        if (error.response.status === 400) {
          errorMessage = 'Validation error. Please check your input.';
        } else if (error.response.status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      // Show detailed error in console
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        config: error.config,
        response: error.response?.data
      });
      
      // Show user-friendly error message
      alert(`${errorMessage}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render the form
  return ( 
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEditMode ? 'Edit Patient' : 'New Patient Registration'}
        </h1>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowSendFormModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            Send to Client
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <WizardProgressBar 
        steps={wizardSteps} 
        currentStep={currentStep} 
        onStepClick={goToStep}
        language={formData.preferredLanguage}
      />

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Step 1: Introduction & Language Preference */}
        <WizardFormStep 
          title="Introduction & Language Preference" 
          spanishTitle="Introducción y Preferencia de Idioma"
          isActive={currentStep === 0}
          language={formData.preferredLanguage}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' 
                  ? '¿Es este formulario para usted o para otra persona?' 
                  : 'Is this form for yourself or someone else?'}
              </h3>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="formType"
                    value="self"
                    checked={formData.formType === 'self'}
                    onChange={() => setFormData(prev => ({ ...prev, formType: 'self' }))}
                    className="mr-2"
                  />
                  <span>{formData.preferredLanguage === 'spanish' ? 'Para mí mismo' : 'For myself'}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="formType"
                    value="other"
                    checked={formData.formType === 'other'}
                    onChange={() => setFormData(prev => ({ ...prev, formType: 'other' }))}
                    className="mr-2"
                  />
                  <span>{formData.preferredLanguage === 'spanish' ? 'Para otra persona' : 'For someone else'}</span>
                </label>
              </div>
            </div>
          </div>
        </WizardFormStep>

        {/* Navigation Buttons */}

        <WizardFormStep
        title="Introduction & Language Preference" 
        spanishTitle="Introducción y Preferencia de Idioma"
        isActive={currentStep === 0}
        language={formData.preferredLanguage}
         >
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={currentStep === 0}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {formData.preferredLanguage === 'spanish' ? 'Anterior' : 'Previous'}
            </span>
          </button>
          
          {currentStep < wizardSteps.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="flex items-center">
                {formData.preferredLanguage === 'spanish' ? 'Siguiente' : 'Next'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Guardando...' : 'Saving...'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Guardar Paciente' : 'Save Patient'}
                </>
              )}
            </button>
          )}

            {formData.formType === 'other' && (
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-2">
                  {formData.preferredLanguage === 'spanish' 
                    ? 'Información del Tutor/Representante Legal' 
                    : 'Guardian/Legal Representative Information'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="guardianInfo.name" className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.preferredLanguage === 'spanish' ? 'Nombre' : 'Name'}
                    </label>
                    <input
                      type="text"
                      id="guardianInfo.name"
                      name="guardianInfo.name"
                      value={formData.guardianInfo?.name || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="guardianInfo.relationship" className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.preferredLanguage === 'spanish' ? 'Relación' : 'Relationship'}
                    </label>
                    <input
                      type="text"
                      id="guardianInfo.relationship"
                      name="guardianInfo.relationship"
                      value={formData.guardianInfo?.relationship || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Idioma Preferido' : 'Preferred Language'}
              </h3>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="preferredLanguage"
                    value="english"
                    checked={formData.preferredLanguage === 'english'}
                    onChange={() => setFormData(prev => ({ ...prev, preferredLanguage: 'english' }))}
                    className="mr-2"
                  />
                  <span>{formData.preferredLanguage === 'spanish' ? 'Inglés' : 'English'}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="preferredLanguage"
                    value="spanish"
                    checked={formData.preferredLanguage === 'spanish'}
                    onChange={() => setFormData(prev => ({ ...prev, preferredLanguage: 'spanish' }))}
                    className="mr-2"
                  />
                  <span>{formData.preferredLanguage === 'spanish' ? 'Español' : 'Spanish'}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="preferredLanguage"
                    value="other"
                    checked={formData.preferredLanguage === 'other'}
                    onChange={() => setFormData(prev => ({ ...prev, preferredLanguage: 'other' }))}
                    className="mr-2"
                  />
                  <span>{formData.preferredLanguage === 'spanish' ? 'Otro' : 'Other'}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="translationHelp"
                  checked={formData.translationHelp || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, translationHelp: e.target.checked }))}
                  className="mr-2"
                />
                <span>{formData.preferredLanguage === 'spanish' ? 'Necesito ayuda con la traducción' : 'I need help with translation'}</span>
              </label>
            </div>
          </div>
        </WizardFormStep>

        <WizardFormStep 
          title="Medical History" 
          spanishTitle="Historial Médico"
          isActive={currentStep === 6}
          language={formData.preferredLanguage}
        >
          <div className="space-y-8">
            {/* Allergies */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Alergias' : 'Allergies'}
              </h3>
              <div className="space-y-2">
                {formData.medicalHistory.allergies.map((allergy, index) => (
                  <div key={`allergy-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={allergy}
                      onChange={(e) => handleArrayChange('allergies', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={formData.preferredLanguage === 'spanish' ? 'Alergia' : 'Allergy'}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('allergies', index)}
                      className="p-2 text-red-500 hover:text-red-700"
                      disabled={formData.medicalHistory.allergies.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('allergies')}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Añadir Alergia' : 'Add Allergy'}
                </button>
              </div>
            </div>

            {/* Medications */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Medicamentos' : 'Medications'}
              </h3>
              <div className="space-y-2">
                {formData.medicalHistory.medications.map((medication, index) => (
                  <div key={`medication-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={medication}
                      onChange={(e) => handleArrayChange('medications', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={formData.preferredLanguage === 'spanish' ? 'Medicamento' : 'Medication'}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('medications', index)}
                      className="p-2 text-red-500 hover:text-red-700"
                      disabled={formData.medicalHistory.medications.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('medications')}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Añadir Medicamento' : 'Add Medication'}
                </button>
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Condiciones Médicas' : 'Medical Conditions'}
              </h3>
              <div className="space-y-2">
                {formData.medicalHistory.conditions.map((condition, index) => (
                  <div key={`condition-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={condition}
                      onChange={(e) => handleArrayChange('conditions', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={formData.preferredLanguage === 'spanish' ? 'Condición' : 'Condition'}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('conditions', index)}
                      className="p-2 text-red-500 hover:text-red-700"
                      disabled={formData.medicalHistory.conditions.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('conditions')}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Añadir Condición' : 'Add Condition'}
                </button>
              </div>
            </div>

            {/* Surgeries */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Cirugías' : 'Surgeries'}
              </h3>
              <div className="space-y-2">
                {formData.medicalHistory.surgeries.map((surgery, index) => (
                  <div key={`surgery-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={surgery}
                      onChange={(e) => handleArrayChange('surgeries', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={formData.preferredLanguage === 'spanish' ? 'Cirugía' : 'Surgery'}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('surgeries', index)}
                      className="p-2 text-red-500 hover:text-red-700"
                      disabled={formData.medicalHistory.surgeries.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('surgeries')}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Añadir Cirugía' : 'Add Surgery'}
                </button>
              </div>
            </div>

            {/* Family History */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Historia Familiar' : 'Family History'}
              </h3>
              <div className="space-y-2">
                {formData.medicalHistory.familyHistory.map((history, index) => (
                  <div key={`family-history-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={history}
                      onChange={(e) => handleArrayChange('familyHistory', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={formData.preferredLanguage === 'spanish' ? 'Historia Familiar' : 'Family History'}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('familyHistory', index)}
                      className="p-2 text-red-500 hover:text-red-700"
                      disabled={formData.medicalHistory.familyHistory.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('familyHistory')}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Añadir Historia Familiar' : 'Add Family History'}
                </button>
              </div>
            </div>
          </div>
        </WizardFormStep>

        {/* Step 2: Referral Information */}
        <WizardFormStep 
          title="Referral Information" 
          spanishTitle="Información de Referencia"
          isActive={currentStep === 1}
          language={formData.preferredLanguage}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' 
                  ? '¿Fue referido por un hospital, clínica o proveedor?' 
                  : 'Were you referred by a hospital, clinic, or provider?'}
              </h3>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="referralInfo.isReferred"
                    checked={formData.referralInfo?.isReferred === true}
                    onChange={() => setFormData(prev => ({ 
                      ...prev, 
                      referralInfo: { ...prev.referralInfo, isReferred: true } 
                    }))}
                    className="mr-2"
                  />
                  <span>{formData.preferredLanguage === 'spanish' ? 'Sí' : 'Yes'}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="referralInfo.isReferred"
                    checked={formData.referralInfo?.isReferred === false}
                    onChange={() => setFormData(prev => ({ 
                      ...prev, 
                      referralInfo: { ...prev.referralInfo, isReferred: false } 
                    }))}
                    className="mr-2"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.referralInfo?.isReferred && (
              <div>
                <label htmlFor="referralInfo.referredBy" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.preferredLanguage === 'spanish' ? 'Referido por' : 'Referred by'}
                </label>
                <input
                  type="text"
                  id="referralInfo.referredBy"
                  name="referralInfo.referredBy"
                  value={formData.referralInfo?.referredBy || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={formData.preferredLanguage === 'spanish' ? 'Nombre del hospital, clínica o proveedor' : 'Hospital, clinic, or provider name'}
                />
              </div>
            )}
          </div>
        </WizardFormStep>

        {/* Step 3: Personal Information */}
        <WizardFormStep 
          title="Personal Information" 
          spanishTitle="Información Personal"
          isActive={currentStep === 2}
          language={formData.preferredLanguage}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Nombre*' : 'First Name*'}
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Apellido*' : 'Last Name*'}
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Fecha de Nacimiento*' : 'Date of Birth*'}
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Género*' : 'Gender*'}
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="male">{formData.preferredLanguage === 'spanish' ? 'Masculino' : 'Male'}</option>
                <option value="female">{formData.preferredLanguage === 'spanish' ? 'Femenino' : 'Female'}</option>
                <option value="other">{formData.preferredLanguage === 'spanish' ? 'Otro' : 'Other'}</option>
              </select>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Correo Electrónico*' : 'Email*'}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Teléfono*' : 'Phone*'}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            {user?.role === 'admin' && (
              <div>
                <label htmlFor="assignedDoctor" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.preferredLanguage === 'spanish' ? 'Doctor Asignado*' : 'Assigned Doctor*'}
                </label>
                <select
                  id="assignedDoctor"
                  name="assignedDoctor"
                  value={formData.assignedDoctor}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.assignedDoctor ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                >
                  <option value="">{formData.preferredLanguage === 'spanish' ? 'Seleccione un doctor' : 'Select a doctor'}</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </option>
                  ))}
                </select>
                {errors.assignedDoctor && <p className="mt-1 text-sm text-red-600">{errors.assignedDoctor}</p>}
              </div>
            )}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Estado' : 'Status'}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="active">{formData.preferredLanguage === 'spanish' ? 'Activo' : 'Active'}</option>
                <option value="inactive">{formData.preferredLanguage === 'spanish' ? 'Inactivo' : 'Inactive'}</option>
                <option value="pending">{formData.preferredLanguage === 'spanish' ? 'Pendiente' : 'Pending'}</option>
                <option value="discharged">{formData.preferredLanguage === 'spanish' ? 'Dado de alta' : 'Discharged'}</option>
              </select>
            </div>
          </div>
        </WizardFormStep>

        {/* Step 4: Address Information */}
        <WizardFormStep 
          title="Address Information" 
          spanishTitle="Información de Dirección"
          isActive={currentStep === 3}
          language={formData.preferredLanguage}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Dirección' : 'Street Address'}
              </label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Ciudad' : 'City'}
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Estado' : 'State'}
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Código Postal' : 'ZIP Code'}
              </label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'País' : 'Country'}
              </label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </WizardFormStep>

        {/* Step 5: Insurance & ID Uploads */}
        <WizardFormStep 
          title="Insurance & ID Uploads" 
          spanishTitle="Cargas de Seguro e Identificación"
          isActive={currentStep === 4}
          language={formData.preferredLanguage}
        >
          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Identificación Gubernamental' : 'Government ID'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {formData.preferredLanguage === 'spanish' 
                  ? 'Por favor, suba una foto de su identificación emitida por el gobierno (licencia de conducir, pasaporte, etc.)' 
                  : 'Please upload a photo of your government-issued ID (driver\'s license, passport, etc.)'}
              </p>
              
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      {formData.preferredLanguage === 'spanish' 
                        ? <><span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte</>
                        : <><span className="font-semibold">Click to upload</span> or drag and drop</>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.preferredLanguage === 'spanish' 
                        ? 'PNG, JPG o PDF (MÁX. 10MB)'
                        : 'PNG, JPG or PDF (MAX. 10MB)'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={() => setFormData(prev => ({ ...prev, governmentIdUploaded: true }))}
                  />
                </label>
              </div>
              
              {formData.governmentIdUploaded && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {formData.preferredLanguage === 'spanish' 
                      ? 'Identificación cargada con éxito'
                      : 'ID uploaded successfully'}
                  </span>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Tarjeta de Seguro' : 'Insurance Card'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {formData.preferredLanguage === 'spanish' 
                  ? 'Por favor, suba fotos del frente y reverso de su tarjeta de seguro'
                  : 'Please upload photos of the front and back of your insurance card'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {formData.preferredLanguage === 'spanish' ? 'Frente de la Tarjeta' : 'Front of Card'}
                  </p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="text-xs text-gray-500">
                      {formData.preferredLanguage === 'spanish' 
                        ? 'PNG, JPG o PDF (MÁX. 10MB)' 
                        : 'PNG, JPG or PDF (MAX. 10MB)'}
                    </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={() => setFormData(prev => ({ ...prev, insuranceCardUploaded: true }))}
                    />
                  </label>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {formData.preferredLanguage === 'spanish' ? 'Reverso de la Tarjeta' : 'Back of Card'}
                  </p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="text-xs text-gray-500">
                        {formData.preferredLanguage === 'spanish' 
                          ? 'PNG, JPG o PDF (MÁX. 10MB)' 
                          : 'PNG, JPG or PDF (MAX. 10MB)'}
                      </p>
                    </div>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </div>
              
              {formData.insuranceCardUploaded && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {formData.preferredLanguage === 'spanish' 
                      ? 'Tarjeta de seguro cargada exitosamente' 
                      : 'Insurance card uploaded successfully'}
                  </span>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' 
                  ? 'Seguro de Auto (Opcional)' 
                  : 'Auto Insurance (Optional)'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {formData.preferredLanguage === 'spanish' 
                  ? 'Si su visita está relacionada con un accidente automovilístico, por favor cargue la información de su seguro de auto' 
                  : 'If your visit is related to an auto accident, please upload your auto insurance information'}
              </p>

              
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      {formData.preferredLanguage === 'spanish' ? (
                        <><span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte</>
                      ) : (
                        <><span className="font-semibold">Click to upload</span> or drag and drop</>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.preferredLanguage === 'spanish' 
                        ? 'PNG, JPG o PDF (MÁX. 10MB)' 
                        : 'PNG, JPG or PDF (MAX. 10MB)'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={() => setFormData(prev => ({ ...prev, autoInsuranceUploaded: true }))}
                  />
                </label>
              </div>
              
              {formData.autoInsuranceUploaded && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {formData.preferredLanguage === 'spanish' 
                      ? 'Seguro de auto cargado exitosamente' 
                      : 'Auto insurance uploaded successfully'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </WizardFormStep>

        {/* Step 6: Attorney Details */}
        <WizardFormStep 
          title="Attorney Details" 
          spanishTitle="Detalles del Abogado"
          isActive={currentStep === 5}
          language={formData.preferredLanguage}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="attorney.name" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Nombre del Abogado' : 'Attorney Name'}
              </label>
              <input
                type="text"
                id="attorney.name"
                name="attorney.name"
                value={formData.attorney?.name || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="attorney.firm" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Nombre de la Firma' : 'Firm Name'}
              </label>
              <input
                type="text"
                id="attorney.firm"
                name="attorney.firm"
                value={formData.attorney?.firm || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="attorney.phone" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Teléfono' : 'Phone'}
              </label>
              <input
                type="tel"
                id="attorney.phone"
                name="attorney.phone"
                value={formData.attorney?.phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="attorney.email" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Correo Electrónico' : 'Email'}
              </label>
              <input
                type="email"
                id="attorney.email"
                name="attorney.email"
                value={formData.attorney?.email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="attorney.caseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Número de Caso' : 'Case Number'}
              </label>
              <input
                type="text"
                id="attorney.caseNumber"
                name="attorney.caseNumber"
                value={formData.attorney?.caseNumber || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formData.preferredLanguage === 'spanish' ? 'Dirección del Abogado' : 'Attorney Address'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label htmlFor="attorney.address.street" className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.preferredLanguage === 'spanish' ? 'Dirección' : 'Street Address'}
                  </label>
                  <input
                    type="text"
                    id="attorney.address.street"
                    name="attorney.address.street"
                    value={formData.attorney?.address?.street || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="attorney.address.city" className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.preferredLanguage === 'spanish' ? 'Ciudad' : 'City'}
                  </label>
                  <input
                    type="text"
                    id="attorney.address.city"
                    name="attorney.address.city"
                    value={formData.attorney?.address?.city || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="attorney.address.state" className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.preferredLanguage === 'spanish' ? 'Estado' : 'State'}
                  </label>
                  <input
                    type="text"
                    id="attorney.address.state"
                    name="attorney.address.state"
                    value={formData.attorney?.address?.state || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="attorney.address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.preferredLanguage === 'spanish' ? 'Código Postal' : 'ZIP Code'}
                  </label>
                  <input
                    type="text"
                    id="attorney.address.zipCode"
                    name="attorney.address.zipCode"
                    value={formData.attorney?.address?.zipCode || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </WizardFormStep>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={currentStep === 0}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {formData.preferredLanguage === 'spanish' ? 'Anterior' : 'Previous'}
            </span>
          </button>
          
          {currentStep < wizardSteps.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="flex items-center">
                {formData.preferredLanguage === 'spanish' ? 'Siguiente' : 'Next'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Guardando...' : 'Saving...'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {formData.preferredLanguage === 'spanish' ? 'Guardar Paciente' : 'Save Patient'}
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Send Form Modal */}
      <SendFormModal
        isOpen={showSendFormModal}
        onClose={() => setShowSendFormModal(false)}
        onSend={async (data: SendFormData) => {
          try {
            // If we have a patient ID, include it in the request
            const payload = {
              email: data.clientEmail,
              name: data.clientName,
              instructions: data.instructions,
              language: formData.preferredLanguage || 'english',
              patientId: formData._id // Include patient ID if available
            };
            
            console.log('Sending form to client with payload:', payload);
            const response = await axios.post('/api/patients/send-to-client', payload);
            
            // Check if the response contains token and emailSent status
            if (response.data && response.data.token) {
              console.log('Form sent successfully with token:', response.data.token);
              if (response.data.emailSent === false) {
                throw new Error('Email could not be sent, but form token was created. Please check server logs.');
              }
            }
            
            return Promise.resolve();
          } catch (error: any) {
            console.error('Error sending form link:', error);
            
            // Provide more specific error message based on the error
            let errorMessage = 'Failed to send form to client';
            
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              if (error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
              } else if (error.response.status === 401) {
                errorMessage = 'Authentication error. Please log in again.';
              } else if (error.response.status === 403) {
                errorMessage = 'You do not have permission to send forms.';
              } else if (error.response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
              }
            } else if (error.request) {
              // The request was made but no response was received
              errorMessage = 'No response from server. Please check your connection.';
            }
            
            // Create an error object with the message
            const enhancedError = new Error(errorMessage);
            return Promise.reject(enhancedError);
          }
        }}
      />
      </div>
  );
};

export default PatientWizardForm;


  

