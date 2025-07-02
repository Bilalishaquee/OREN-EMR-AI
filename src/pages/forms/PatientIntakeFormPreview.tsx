import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface FormItem {
  id: string;
  type: string;
  questionText: string;
  isRequired: boolean;
  options?: string[];
  placeholder?: string;
  instructions?: string;
  multipleLines?: boolean;
  demographicFields?: {
    fieldName: string;
    fieldType: string;
    required: boolean;
    options?: string[];
  }[];
  insuranceFields?: {
    fieldName: string;
    fieldType: string;
    required: boolean;
    options?: string[];
  }[];
  matrix?: {
    rowHeader?: string;
    columnHeaders: string[];
    columnTypes: string[];
    rows: string[];
    dropdownOptions: string[][];
    displayTextBox: boolean;
  };
}

interface FormTemplate {
  _id?: string;
  title: string;
  description: string;
  isActive: boolean;
  isPublic: boolean;
  language: string;
  items: FormItem[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PatientIntakeFormPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [language, setLanguage] = useState<string>('english');
  const [doctors, setDoctors] = useState<Array<{_id: string, firstName: string, lastName: string}>>([]);
  
  useEffect(() => {
    if (id) {
      fetchFormTemplate();
      fetchDoctors();
    }
  }, [id]);
  
  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/auth/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };
  
  const fetchFormTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/form-templates/${id}`);
      setFormTemplate(response.data);
    } catch (error) {
      console.error('Error fetching form template:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (questionId: string, value: any, fieldName?: string) => {
    if (fieldName) {
      // For demographic and insurance fields, store with field name
      setResponses(prev => ({
        ...prev,
        [`${questionId}_${fieldName}`]: value
      }));
    } else {
      // For regular questions
      setResponses(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };
  
  const handleNext = () => {
    if (!formTemplate) return;
    
    // Validate current step if required
    const currentQuestion = formTemplate.items[currentStep];
    
    if (currentQuestion.isRequired) {
      // Different validation based on question type
      if ((currentQuestion.type === 'blank' || currentQuestion.type === 'openAnswer') && !responses[currentQuestion.id]) {
        alert('This question is required');
        return;
      }
      
      // For demographics, check if required fields are filled
      if (currentQuestion.type === 'demographics' && currentQuestion.demographicFields) {
        const requiredFields = currentQuestion.demographicFields.filter(field => field.required);
        for (const field of requiredFields) {
          if (!responses[`${currentQuestion.id}_${field.fieldName}`]) {
            alert(`${field.fieldName} is required`);
            return;
          }
        }
        
        // Check if assignedDoctor is selected
        if (!responses[`${currentQuestion.id}_assignedDoctor`] && !responses['assignedDoctor']) {
          alert('Assigned Doctor is required');
          return;
        }
      }
      
      // For insurance, check if required fields are filled
      if ((currentQuestion.type === 'primaryInsurance' || currentQuestion.type === 'secondaryInsurance') && 
          currentQuestion.insuranceFields) {
        const requiredFields = currentQuestion.insuranceFields.filter(field => field.required);
        for (const field of requiredFields) {
          if (!responses[`${currentQuestion.id}_${field.fieldName}`]) {
            alert(`${field.fieldName} is required`);
            return;
          }
        }
      }
    }
    
    if (currentStep < filteredItems.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleSubmit = async () => {
    if (!formTemplate) return;
    
    // Validate current step if required
    const currentQuestion = formTemplate.items[currentStep];
    if (currentQuestion.isRequired && !responses[currentQuestion.id]) {
      alert('This question is required');
      return;
    }
    
    try {
      // Format responses for submission
      const formattedResponses = Object.keys(responses).map(questionId => {
        const question = formTemplate.items.find(item => item.id === questionId);
        return {
          questionId,
          questionType: question?.type || 'openAnswer',
          questionText: question?.questionText || '',
          answer: responses[questionId]
        };
      });
      
      // Create a new patient record from demographic information if available
      let patientId = null;
      const demographicQuestion = formTemplate.items.find(item => item.type === 'demographics');
      
      if (demographicQuestion && demographicQuestion.demographicFields) {
        // Extract patient data from responses
        const patientData = {
          firstName: responses[`${demographicQuestion.id}_firstName`] || '',
          lastName: responses[`${demographicQuestion.id}_lastName`] || '',
          dateOfBirth: responses[`${demographicQuestion.id}_dateOfBirth`] || '',
          gender: responses[`${demographicQuestion.id}_gender`] || '',
          email: responses[`${demographicQuestion.id}_email`] || '',
          phone: responses[`${demographicQuestion.id}_phone`] || '',
          address: {
            street: responses[`${demographicQuestion.id}_street`] || '',
            city: responses[`${demographicQuestion.id}_city`] || '',
            state: responses[`${demographicQuestion.id}_state`] || '',
            zipCode: responses[`${demographicQuestion.id}_zipCode`] || ''
          },
          // Add assignedDoctor field which is required by the Patient model
          assignedDoctor: responses[`${demographicQuestion.id}_assignedDoctor`] || responses['assignedDoctor'] || ''
        };
        
        // Create new patient
        const patientResponse = await axios.post('/api/patients', patientData);
        patientId = patientResponse.data.patient._id;
      }
      
      // Submit form response
      await axios.post('/api/form-responses', {
        formTemplate: id,
        patient: patientId,
        responses: formattedResponses,
        status: 'completed',
        completedAt: new Date()
      });
      
      alert('Form submitted successfully!');
      
      // Navigate to patient list if a patient was created
      if (patientId) {
        navigate('/patients');
      } else {
        navigate(`/forms/templates/${id}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!formTemplate) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Form not found</h2>
          <button
            onClick={() => navigate('/forms/templates')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }
  
  // No duplicate definition needed as it's now defined above
  
  // Filter questions based on language preference
  const filteredItems = formTemplate.items.filter(item => {
    // For language selection question, always show
    if (item.questionText.includes('Language Preference')) {
      return true;
    }
    
    // For English language, show English questions (those without Spanish text)
    if (language === 'english') {
      return !item.questionText.includes('¿') && !item.questionText.includes('español');
    }
    
    // For Spanish language, show Spanish questions
    if (language === 'spanish') {
      return item.questionText.includes('¿') || item.questionText.includes('español');
    }
    
    return true;
  });
  
  // Get the current question based on the current step
  const currentQuestion = filteredItems[currentStep];
  
  const progress = ((currentStep + 1) / filteredItems.length) * 100;
  
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-2 bg-gray-200">
          <div 
            className="h-2 bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="p-6">
          <div className="text-sm text-gray-500 mb-2">
            {currentStep + 1} / {filteredItems.length}
          </div>
          
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">{currentQuestion.questionText}</h1>
            {currentQuestion.instructions && (
              <p className="mt-2 text-gray-600">{currentQuestion.instructions}</p>
            )}
          </div>
          
          <div className="mb-8">
            {(currentQuestion.type === 'blank' || currentQuestion.type === 'openAnswer') && (
              <div>
                {currentQuestion.multipleLines ? (
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder={currentQuestion.placeholder || 'Enter your answer here'}
                    value={responses[currentQuestion.id] || ''}
                    onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                  ></textarea>
                ) : (
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={currentQuestion.placeholder || 'Enter your answer here'}
                    value={responses[currentQuestion.id] || ''}
                    onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                  />
                )}
              </div>
            )}
            
            {currentQuestion.type === 'demographics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.demographicFields?.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.fieldName}{field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.fieldType === 'text' && (
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Enter ${field.fieldName.toLowerCase()}`}
                        value={responses[`${currentQuestion.id}_${field.fieldName}`] || ''}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value, field.fieldName)}
                      />
                    )}
                    {field.fieldType === 'date' && (
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={responses[`${currentQuestion.id}_${field.fieldName}`] || ''}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value, field.fieldName)}
                      />
                    )}
                    {field.fieldType === 'dropdown' && (
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={responses[`${currentQuestion.id}_${field.fieldName}`] || ''}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value, field.fieldName)}
                      >
                        <option value="">Select {field.fieldName}</option>
                        {field.options?.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
                
                {/* Doctor Selection Dropdown - Required Field */}
                <div className="col-span-1 md:col-span-2 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Doctor<span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={responses[`${currentQuestion.id}_assignedDoctor`] || responses['assignedDoctor'] || ''}
                    onChange={(e) => {
                      // Store in both formats for flexibility
                      handleInputChange(currentQuestion.id, e.target.value, 'assignedDoctor');
                      setResponses(prev => ({
                        ...prev,
                        'assignedDoctor': e.target.value
                      }));
                    }}
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {(currentQuestion.type === 'primaryInsurance' || currentQuestion.type === 'secondaryInsurance') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.insuranceFields?.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.fieldName}{field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.fieldType === 'text' && (
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Enter ${field.fieldName.toLowerCase()}`}
                        value={responses[`${currentQuestion.id}_${field.fieldName}`] || ''}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value, field.fieldName)}
                      />
                    )}
                    {field.fieldType === 'date' && (
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={responses[`${currentQuestion.id}_${field.fieldName}`] || ''}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value, field.fieldName)}
                      />
                    )}
                    {field.fieldType === 'dropdown' && (
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={responses[`${currentQuestion.id}_${field.fieldName}`] || ''}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value, field.fieldName)}
                      >
                        <option value="">Select {field.fieldName}</option>
                        {field.options?.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {currentQuestion.type === 'allergies' && (
              <div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      {currentQuestion.matrix?.columnHeaders.map((header, index) => (
                        <th key={index} className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuestion.matrix?.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {currentQuestion.matrix?.columnHeaders.map((_, colIndex) => (
                          <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {currentQuestion.matrix?.columnTypes[colIndex] === 'dropdown' ? (
                              <select
                                className="w-full p-1 border border-gray-300 rounded-md text-sm"
                                value={responses[`${currentQuestion.id}_${rowIndex}_${colIndex}`] || ''}
                                onChange={(e) => {
                                  const matrixValue = e.target.value;
                                  setResponses(prev => ({
                                    ...prev,
                                    [`${currentQuestion.id}_${rowIndex}_${colIndex}`]: matrixValue,
                                    // Also store in a format suitable for the API
                                    [currentQuestion.id]: [
                                      ...(Array.isArray(prev[currentQuestion.id]) ? prev[currentQuestion.id] : []),
                                      { rowIndex, columnIndex: colIndex, value: matrixValue }
                                    ]
                                  }));
                                }}
                              >
                                <option value="">Select</option>
                                {currentQuestion.matrix?.dropdownOptions[colIndex]?.map((option, i) => (
                                  <option key={i} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className="w-full p-1 border border-gray-300 rounded-md text-sm"
                                value={responses[`${currentQuestion.id}_${rowIndex}_${colIndex}`] || ''}
                                onChange={(e) => {
                                  const matrixValue = e.target.value;
                                  setResponses(prev => ({
                                    ...prev,
                                    [`${currentQuestion.id}_${rowIndex}_${colIndex}`]: matrixValue,
                                    // Also store in a format suitable for the API
                                    [currentQuestion.id]: [
                                      ...(Array.isArray(prev[currentQuestion.id]) ? prev[currentQuestion.id] : []),
                                      { rowIndex, columnIndex: colIndex, value: matrixValue }
                                    ]
                                  }));
                                }}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {currentQuestion.matrix?.displayTextBox && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Information
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Enter any additional information about your allergies"
                      value={responses[`${currentQuestion.id}_additionalInfo`] || ''}
                      onChange={(e) => handleInputChange(currentQuestion.id, e.target.value, 'additionalInfo')}
                    ></textarea>
                  </div>
                )}
              </div>
            )}

            {/* Special handling for language preference question */}
            {currentStep === 0 && currentQuestion.questionText.includes('Language Preference') && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="english"
                    name="language"
                    checked={language === 'english'}
                    onChange={() => handleLanguageChange('english')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="english" className="text-gray-700">I am able to complete this form in English</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="spanish"
                    name="language"
                    checked={language === 'spanish'}
                    onChange={() => handleLanguageChange('spanish')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="spanish" className="text-gray-700">Mejor puedo responder este formulario en español</label>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50 flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
            
            {currentStep < filteredItems.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientIntakeFormPreview;