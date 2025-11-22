import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft } from 'react-icons/fi';

// Import components from PatientWizardForm
import WizardProgressBar from '../../components/patients/WizardProgressBar';
import WizardFormStep from '../../components/patients/WizardFormStep';

// Types
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Attorney {
  name: string;
  email: string;
  phone: string;
  caseNumber: string;
  address: Address;
}

interface Patient {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: Address;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  attorney: Attorney;
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    bodyParts: Array<{
      name: string;
      side: string;
    }>;
  };
  preferredLanguage: string;
  forSomeoneElse: boolean;
  assignedDoctor: string;
}

const PatientFormPublic: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const language = searchParams.get('lang') || 'english';
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Patient>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: ''
    },
    attorney: {
      name: '',
      email: '',
      phone: '',
      caseNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    },
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      surgeries: [],
      familyHistory: []
    },
    subjective: {
      chiefComplaint: '',
      historyOfPresentIllness: '',
      bodyParts: []
    },
    preferredLanguage: language,
    forSomeoneElse: false,
    assignedDoctor: ''
  });
  
  // Define wizard steps based on language
  const wizardStepsEnglish = [
    'Introduction',
    'Personal Info',
    'Address',
    'Insurance',
    'Attorney',
    'Medical History',
    'Visit Details',
    'Subjective Info',
    'Review'
  ];
  
  const wizardStepsSpanish = [
    'Introducción',
    'Información Personal',
    'Dirección',
    'Seguro',
    'Abogado',
    'Historia Médica',
    'Detalles de Visita',
    'Información Subjetiva',
    'Revisar'
  ];
  
  const wizardSteps = formData.preferredLanguage === 'spanish' ? wizardStepsSpanish : wizardStepsEnglish;
  
  // Validate token on component mount
  useEffect(() => {
    // In a real implementation, you would validate the token with the server
    // For now, we'll just simulate a loading state
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [token]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof Patient],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle array field changes (for medical history)
  const handleArrayChange = (arrayName: string, index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev.medicalHistory[arrayName as keyof typeof prev.medicalHistory]];
      newArray[index] = value;
      
      return {
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          [arrayName]: newArray
        }
      };
    });
  };
  
  // Add item to array (for medical history)
  const addArrayItem = (arrayName: string) => {
    setFormData(prev => {
      return {
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          [arrayName]: [...prev.medicalHistory[arrayName as keyof typeof prev.medicalHistory], '']
        }
      };
    });
  };
  
  // Remove item from array (for medical history)
  const removeArrayItem = (arrayName: string, index: number) => {
    setFormData(prev => {
      const newArray = [...prev.medicalHistory[arrayName as keyof typeof prev.medicalHistory]];
      newArray.splice(index, 1);
      
      return {
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          [arrayName]: newArray
        }
      };
    });
  };
  
  // Handle body part changes
  const addBodyPart = () => {
    setFormData(prev => ({
      ...prev,
      subjective: {
        ...prev.subjective,
        bodyParts: [...prev.subjective.bodyParts, { name: '', side: '' }]
      }
    }));
  };
  
  const removeBodyPart = (index: number) => {
    setFormData(prev => {
      const newBodyParts = [...prev.subjective.bodyParts];
      newBodyParts.splice(index, 1);
      
      return {
        ...prev,
        subjective: {
          ...prev.subjective,
          bodyParts: newBodyParts
        }
      };
    });
  };
  
  const changeBodyPart = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newBodyParts = [...prev.subjective.bodyParts];
      newBodyParts[index] = {
        ...newBodyParts[index],
        [field]: value
      };
      
      return {
        ...prev,
        subjective: {
          ...prev.subjective,
          bodyParts: newBodyParts
        }
      };
    });
  };
  
  // Navigation functions
  const nextStep = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToStep = (step: number) => {
    if (step >= 0 && step < wizardSteps.length) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Send the form data to the server along with the token for validation
      const response = await axios.post(`/api/patients/form-submission/${token}`, formData);
      
      console.log('Form submitted successfully:', response.data);
      
      // Redirect to thank you page
      navigate(`/patients/thank-you?lang=${formData.preferredLanguage}`);
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      // Provide more specific error messages based on the error response
      let errorMessage = formData.preferredLanguage === 'spanish'
        ? 'Error al enviar el formulario. Por favor, inténtelo de nuevo.'
        : 'Error submitting form. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
          
          // Translate common error messages if language is Spanish
          if (formData.preferredLanguage === 'spanish') {
            if (errorMessage === 'Invalid or expired token') {
              errorMessage = 'Token inválido o expirado';
            } else if (errorMessage === 'This form has already been submitted') {
              errorMessage = 'Este formulario ya ha sido enviado';
            } else if (errorMessage.includes('Missing required fields')) {
              errorMessage = 'Faltan campos obligatorios';
            }
          }
        } else if (error.response.status === 400) {
          errorMessage = formData.preferredLanguage === 'spanish'
            ? 'Datos de formulario inválidos. Por favor, verifique la información.'
            : 'Invalid form data. Please check your information.';
        } else if (error.response.status === 500) {
          errorMessage = formData.preferredLanguage === 'spanish'
            ? 'Error del servidor. Por favor, inténtelo de nuevo más tarde.'
            : 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = formData.preferredLanguage === 'spanish'
          ? 'No se recibió respuesta del servidor. Por favor, verifique su conexión.'
          : 'No response from server. Please check your connection.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render the form
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {formData.preferredLanguage === 'spanish' ? 'Formulario Médico del Paciente' : 'Patient Medical Form'}
        </h1>
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
                {formData.preferredLanguage === 'spanish' ? 'Bienvenido a nuestro formulario médico' : 'Welcome to our medical form'}
              </h3>
              <p className="text-gray-600">
                {formData.preferredLanguage === 'spanish' 
                  ? 'Por favor complete este formulario con su información médica. Esta información nos ayudará a brindarle la mejor atención posible.'
                  : 'Please complete this form with your medical information. This information will help us provide you with the best possible care.'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? '¿Es este formulario para usted mismo o para otra persona?' : 'Is this form for yourself or someone else?'}
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="forSomeoneElse"
                    value="false"
                    checked={!formData.forSomeoneElse}
                    onChange={() => setFormData({...formData, forSomeoneElse: false})}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">
                    {formData.preferredLanguage === 'spanish' ? 'Para mí mismo' : 'For myself'}
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="forSomeoneElse"
                    value="true"
                    checked={formData.forSomeoneElse}
                    onChange={() => setFormData({...formData, forSomeoneElse: true})}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">
                    {formData.preferredLanguage === 'spanish' ? 'Para otra persona' : 'For someone else'}
                  </span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.preferredLanguage === 'spanish' ? 'Idioma Preferido' : 'Preferred Language'}
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="preferredLanguage"
                    value="english"
                    checked={formData.preferredLanguage === 'english'}
                    onChange={() => setFormData({...formData, preferredLanguage: 'english'})}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">English</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="preferredLanguage"
                    value="spanish"
                    checked={formData.preferredLanguage === 'spanish'}
                    onChange={() => setFormData({...formData, preferredLanguage: 'spanish'})}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Español</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {formData.preferredLanguage === 'spanish' ? 'Siguiente' : 'Next'}
            </button>
          </div>
        </WizardFormStep>
        
        {/* Additional form steps would be implemented here */}
        {/* For brevity, I'm only showing the first step */}
        {/* In a real implementation, you would add all the steps from PatientWizardForm */}
        
        {/* Navigation buttons */}
        {currentStep > 0 && (
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {formData.preferredLanguage === 'spanish' ? 'Anterior' : 'Previous'}
            </button>
            
            {currentStep < wizardSteps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {formData.preferredLanguage === 'spanish' ? 'Siguiente' : 'Next'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {formData.preferredLanguage === 'spanish' ? 'Enviando...' : 'Submitting...'}
                  </>
                ) : (
                  formData.preferredLanguage === 'spanish' ? 'Enviar Formulario' : 'Submit Form'
                )}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientFormPublic;