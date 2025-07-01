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
  
  useEffect(() => {
    if (id) {
      fetchFormTemplate();
    }
  }, [id]);
  
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
  
  const handleInputChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleFieldInputChange = (questionId: string, fieldName: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [fieldName]: value
      }
    }));
  };
  
  const handleNext = () => {
    if (!formTemplate) return;
    
    // Validate current step if required
    const currentQuestion = formTemplate.items[currentStep];
    
    if (currentQuestion.isRequired) {
      // For regular questions
      if (currentQuestion.type !== 'demographics' && currentQuestion.type !== 'primaryInsurance' && currentQuestion.type !== 'secondaryInsurance') {
        if (!responses[currentQuestion.id]) {
          alert('This question is required');
          return;
        }
      }
      
      // For demographics questions
      if (currentQuestion.type === 'demographics' && currentQuestion.demographicFields) {
        const requiredFields = currentQuestion.demographicFields.filter(field => field.required);
        const fieldResponses = responses[currentQuestion.id] || {};
        
        for (const field of requiredFields) {
          if (!fieldResponses[field.fieldName]) {
            alert(`${field.fieldName} is required`);
            return;
          }
        }
      }
      
      // For insurance questions
      if ((currentQuestion.type === 'primaryInsurance' || currentQuestion.type === 'secondaryInsurance') && currentQuestion.insuranceFields) {
        const requiredFields = currentQuestion.insuranceFields.filter(field => field.required);
        const fieldResponses = responses[currentQuestion.id] || {};
        
        for (const field of requiredFields) {
          if (!fieldResponses[field.fieldName]) {
            alert(`${field.fieldName} is required`);
            return;
          }
        }
      }
    }
    
    if (currentStep < formTemplate.items.length - 1) {
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
  
  const handleSubmit = () => {
    // In a real implementation, this would submit the form responses
    alert('Form submitted successfully!');
    navigate(`/forms/templates/${id}`);
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
  
  const currentQuestion = formTemplate.items[currentStep];
  const progress = ((currentStep + 1) / formTemplate.items.length) * 100;
  
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
            {currentStep + 1} / {formTemplate.items.length}
          </div>
          
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">{currentQuestion.questionText}</h1>
            {currentQuestion.instructions && (
              <p className="mt-2 text-gray-600">{currentQuestion.instructions}</p>
            )}
          </div>
          
          <div className="mb-8">
            {currentQuestion.type === 'blank' && (
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
                        value={(responses[currentQuestion.id]?.[field.fieldName] || '')}
                        onChange={(e) => handleFieldInputChange(currentQuestion.id, field.fieldName, e.target.value)}
                      />
                    )}
                    {field.fieldType === 'date' && (
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={(responses[currentQuestion.id]?.[field.fieldName] || '')}
                        onChange={(e) => handleFieldInputChange(currentQuestion.id, field.fieldName, e.target.value)}
                      />
                    )}
                    {field.fieldType === 'dropdown' && (
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={(responses[currentQuestion.id]?.[field.fieldName] || '')}
                        onChange={(e) => handleFieldInputChange(currentQuestion.id, field.fieldName, e.target.value)}
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
                        value={(responses[currentQuestion.id]?.[field.fieldName] || '')}
                        onChange={(e) => handleFieldInputChange(currentQuestion.id, field.fieldName, e.target.value)}
                      />
                    )}
                    {field.fieldType === 'date' && (
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={(responses[currentQuestion.id]?.[field.fieldName] || '')}
                        onChange={(e) => handleFieldInputChange(currentQuestion.id, field.fieldName, e.target.value)}
                      />
                    )}
                    {field.fieldType === 'dropdown' && (
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={(responses[currentQuestion.id]?.[field.fieldName] || '')}
                        onChange={(e) => handleFieldInputChange(currentQuestion.id, field.fieldName, e.target.value)}
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
                                value={responses[currentQuestion.id]?.[`${row}-${colIndex}`] || ''}
                                onChange={(e) => handleFieldInputChange(currentQuestion.id, `${row}-${colIndex}`, e.target.value)}
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
                                value={responses[currentQuestion.id]?.[`${row}-${colIndex}`] || ''}
                                onChange={(e) => handleFieldInputChange(currentQuestion.id, `${row}-${colIndex}`, e.target.value)}
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
                      value={responses[currentQuestion.id]?.['additionalInfo'] || ''}
                      onChange={(e) => handleFieldInputChange(currentQuestion.id, 'additionalInfo', e.target.value)}
                    ></textarea>
                  </div>
                )}
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
            
            {currentStep < formTemplate.items.length - 1 ? (
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