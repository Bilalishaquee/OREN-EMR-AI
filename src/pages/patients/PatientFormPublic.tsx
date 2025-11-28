import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Types
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
  mixedControlsConfig?: {
    label: string;
    controlType: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
  }[];
  fileTypes?: string[];
  maxFileSize?: number;
  signaturePrompt?: string;
  bodyMapType?: string;
  allowPatientMarkings?: boolean;
  editorContent?: string;
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

// Quill modules and formats configuration
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic'],
    [{ color: ['#000000', '#ff0000', '#00ff00', '#0000ff'] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'color',
  'list',
  'bullet',
];

const PatientFormPublic: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const language = searchParams.get('lang') || 'english';
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [doctors, setDoctors] = useState<Array<{ _id: string; firstName: string; lastName: string }>>([]);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  // Fetch form template by token
  useEffect(() => {
    const fetchFormByToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`/api/patients/form-by-token/${token}`);
        
        if (response.data.success && response.data.formTemplate) {
          // Process form template items
          let formData = response.data.formTemplate;
          
          if (formData && Array.isArray(formData.items)) {
            formData.items = formData.items.map((item: any, index: number) => {
              let correctedType = item.type || 'openAnswer';
              if (item.questionText?.toLowerCase().includes('(section)')) {
                correctedType = 'section';
              } else if (item.questionText?.toLowerCase().includes('upload') || item.questionText?.toLowerCase().includes('image')) {
                correctedType = 'fileAttachment';
              } else if (item.questionText?.toLowerCase().includes('signature')) {
                correctedType = 'eSignature';
              } else if (item.questionText?.toLowerCase().includes('check the boxes') || item.questionText?.toLowerCase().includes('select one or more')) {
                correctedType = 'multipleChoiceMultiple';
              } else if (item.questionText?.toLowerCase().includes('language preference')) {
                correctedType = 'multipleChoiceSingle';
              }

              return {
                ...item,
                id: item.id || item._id || `q_${Math.random().toString(36).substring(2, 15)}`,
                questionText: item.questionText || 'Untitled Question',
                type: correctedType,
                isRequired: item.isRequired ?? false,
                options: correctedType === 'multipleChoiceSingle' || correctedType === 'multipleChoiceMultiple' ? item.options || ['Yes', 'No'] : item.options,
                fileTypes: correctedType === 'fileAttachment' ? item.fileTypes || ['image/jpeg', 'image/png', 'application/pdf'] : item.fileTypes,
                maxFileSize: correctedType === 'fileAttachment' ? item.maxFileSize || 5 : item.maxFileSize,
                bodyMapType: correctedType === 'bodyMap' ? item.bodyMapType || 'fullBody' : item.bodyMapType,
                allowPatientMarkings: correctedType === 'bodyMap' ? item.allowPatientMarkings ?? true : item.allowPatientMarkings,
                editorContent: correctedType === 'smartEditor' ? item.editorContent || '<p>Enter your content here...</p>' : item.editorContent,
              };
            });
          }

          setFormTemplate(formData);
          setTokenInfo(response.data.tokenInfo);
          
          // Set doctors from response (included in form-by-token endpoint)
          if (response.data.doctors) {
            setDoctors(response.data.doctors);
          }
        } else {
          // No form template - show error
          setFormTemplate(null);
        }
      } catch (error: any) {
        console.error('Error fetching form by token:', error);
        setFormTemplate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormByToken();
  }, [token]);

  // Filter items based on language
  const filteredItems = formTemplate?.items
    .filter(item => {
      if (item.type === 'section') return true;
      if (item.questionText?.includes('Language Preference')) return true;
      if (language === 'english') {
        return !item.questionText?.toLowerCase().includes('español') && !item.questionText?.includes('¿');
      }
      if (language === 'spanish') {
        return item.questionText?.toLowerCase().includes('español') || item.questionText?.includes('¿');
      }
      return true;
    })
    .sort((a, b) => a.type === 'demographics' ? -1 : b.type === 'demographics' ? 1 : 0)
    || [];

  const currentQuestion = filteredItems[currentStep];

  // Handle input changes
  const handleInputChange = (
    questionId: string,
    value: any,
    fieldName?: string,
    rowIndex?: number,
    columnIndex?: number
  ) => {
    if (fieldName) {
      // For nested fields (demographics, insurance)
      setResponses(prev => ({
        ...prev,
        [`${questionId}_${fieldName}`]: value
      }));
    } else if (rowIndex !== undefined && columnIndex !== undefined) {
      // For matrix questions
      setResponses(prev => {
        const existing = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        const filtered = existing.filter((item: any) => !(item.rowIndex === rowIndex && item.columnIndex === columnIndex));
        return {
          ...prev,
          [questionId]: [...filtered, { rowIndex, columnIndex, value }]
        };
      });
    } else {
      // Regular input
      setResponses(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  // Handle file uploads
  const handleFileChange = (questionId: string, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setResponses(prev => ({
        ...prev,
        [questionId]: fileArray
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formTemplate || !token) return;

    setIsSubmitting(true);

    try {
      // Build formatted responses
      const formattedResponses = formTemplate.items
        .filter(item => !item.questionText?.includes('Language Preference') && item.type !== 'section')
        .map(question => {
          const qid = question.id;
          const type = question.type;
          const record: any = { questionId: qid, questionType: type, questionText: question.questionText };

          if (type === 'blank' || type === 'openAnswer' || type === 'smartEditor') {
            record.answer = responses[qid] || '';
          } else if (type === 'demographics') {
            record.answer = {};
            question.demographicFields?.forEach(field => {
              const k = `${qid}_${field.fieldName}`;
              if (responses[k]) record.answer[field.fieldName] = responses[k];
            });
            if (responses[`${qid}_assignedDoctor`] || responses['assignedDoctor']) {
              record.answer['assignedDoctor'] = responses[`${qid}_assignedDoctor`] || responses['assignedDoctor'];
            }
          } else if (type === 'primaryInsurance' || type === 'secondaryInsurance') {
            record.answer = {};
            question.insuranceFields?.forEach(field => {
              const k = `${qid}_${field.fieldName}`;
              if (responses[k]) record.answer[field.fieldName] = responses[k];
            });
          } else if (type === 'allergies' || type === 'matrix' || type === 'matrixSingleAnswer') {
            const matrixResponses = Array.isArray(responses[qid])
              ? responses[qid].filter((item: any) => item && typeof item.rowIndex === 'number' && typeof item.columnIndex === 'number' && item.value !== undefined)
              : [];
            record.matrixResponses = matrixResponses;
            if (responses[`${qid}_additionalInfo`]) record.additionalInfo = responses[`${qid}_additionalInfo`];
          } else if (type === 'multipleChoiceSingle') {
            record.answer = responses[qid] || '';
          } else if (type === 'multipleChoiceMultiple') {
            record.answer = Array.isArray(responses[qid]) ? responses[qid] : [];
          } else if (type === 'date') {
            record.answer = responses[qid] || '';
          } else if (type === 'fileAttachment') {
            record.fileAttachments = [];
          } else if (type === 'eSignature') {
            record.signature = responses[qid] || null;
          } else if (type === 'bodyMap') {
            record.bodyMapMarkings = responses[qid]?.markings || [];
            record.description = responses[qid]?.description || '';
          } else if (type === 'mixedControls') {
            record.mixedControlsResponses = question.mixedControlsConfig?.map((_, idx) => ({
              index: idx,
              value: responses[`${qid}_${idx}`] || '',
            })) || [];
          } else {
            record.answer = responses[qid] || '';
          }

          return record;
        })
        .filter(r =>
          r.answer ||
          (r.matrixResponses && r.matrixResponses.length) ||
          (r.fileAttachments && r.fileAttachments.length) ||
          r.signature ||
          (r.bodyMapMarkings && r.bodyMapMarkings.length) ||
          (r.mixedControlsResponses && r.mixedControlsResponses.length) ||
          r.description
        );

      if (formattedResponses.length === 0) {
        alert('No responses to submit. Please fill out at least one question.');
        setIsSubmitting(false);
        return;
      }

      // Validate demographics if present (backend will create patient)
      const demographicQuestion = formTemplate.items.find(item => item.type === 'demographics');
      
      if (demographicQuestion && demographicQuestion.demographicFields) {
        const assignedDoctor = responses[`${demographicQuestion.id}_assignedDoctor`] || responses['assignedDoctor'] || '';
        if (!assignedDoctor) {
          alert('Assigned Doctor is required');
          setIsSubmitting(false);
          return;
        }
      }

      // Submit form response - backend will create patient from demographics if needed
      const submissionPayload = {
        formTemplate: formTemplate._id,
        patientId: null, // Let backend create patient from demographics
        responses: formattedResponses,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

      const response = await axios.post(`/api/patients/form-submission/${token}`, submissionPayload, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Show success message and stay on the form page
      setSubmissionSuccess(true);
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(error.response?.data?.message || 'Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const nextStep = () => {
    if (currentStep < filteredItems.length - 1) {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Form Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">Thank you for completing the form. Your information has been received.</p>
        </div>
      </div>
    );
  }

  if (!formTemplate || !formTemplate.items.length) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Form not found</h2>
          <p className="text-gray-600">The form you're looking for doesn't exist or has expired.</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading question</h2>
          <p className="mt-2 text-gray-600">There was a problem loading the current question.</p>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / filteredItems.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-2 bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{formTemplate.title}</h1>
            <div className="text-sm text-gray-500">
              {currentStep + 1} / {filteredItems.length}
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            {currentQuestion.type === 'section' ? (
              <h2 className="text-2xl font-semibold text-gray-900">{currentQuestion.questionText.replace('(section)', '')}</h2>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {currentQuestion.questionText}
                  {currentQuestion.isRequired && <span className="text-red-500 ml-1">*</span>}
                </h2>
                {currentQuestion.instructions && (
                  <p className="mt-2 text-gray-600">{currentQuestion.instructions}</p>
                )}
              </>
            )}
          </div>

          {/* Answer Input */}
          {currentQuestion.type !== 'section' && (
            <div className="mb-8">
              {(currentQuestion.type === 'blank' || currentQuestion.type === 'openAnswer') ? (
                <div>
                  {currentQuestion.multipleLines ? (
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder={currentQuestion.placeholder || 'Enter your answer here'}
                      value={responses[currentQuestion.id] || ''}
                      onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                    />
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
              ) : currentQuestion.type === 'demographics' ? (
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
                  <div className="col-span-1 md:col-span-2 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Doctor<span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={responses[`${currentQuestion.id}_assignedDoctor`] || responses['assignedDoctor'] || ''}
                      onChange={(e) => {
                        handleInputChange(currentQuestion.id, e.target.value, 'assignedDoctor');
                        setResponses(prev => ({
                          ...prev,
                          'assignedDoctor': e.target.value,
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
              ) : currentQuestion.type === 'primaryInsurance' || currentQuestion.type === 'secondaryInsurance' ? (
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
              ) : currentQuestion.type === 'multipleChoiceSingle' ? (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id={`${currentQuestion.id}_option_${index}`}
                        name={`${currentQuestion.id}_options`}
                        value={option}
                        checked={responses[currentQuestion.id] === option}
                        onChange={() => handleInputChange(currentQuestion.id, option)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`${currentQuestion.id}_option_${index}`} className="text-gray-700">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              ) : currentQuestion.type === 'multipleChoiceMultiple' ? (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => {
                    const selectedOptions = responses[currentQuestion.id] || [];
                    const isChecked = Array.isArray(selectedOptions) && selectedOptions.includes(option);
                    return (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`${currentQuestion.id}_option_${index}`}
                          value={option}
                          checked={isChecked}
                          onChange={(e) => {
                            const current = Array.isArray(responses[currentQuestion.id]) ? responses[currentQuestion.id] : [];
                            if (e.target.checked) {
                              handleInputChange(currentQuestion.id, [...current, option]);
                            } else {
                              handleInputChange(currentQuestion.id, current.filter((o: string) => o !== option));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`${currentQuestion.id}_option_${index}`} className="text-gray-700">
                          {option}
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : currentQuestion.type === 'fileAttachment' ? (
                <div>
                  <input
                    type="file"
                    multiple
                    accept={currentQuestion.fileTypes?.join(',') || '*'}
                    onChange={(e) => handleFileChange(currentQuestion.id, e.target.files)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Max file size: {currentQuestion.maxFileSize || 5}MB
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Question type not yet supported in public form</p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </button>
            {currentStep < filteredItems.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientFormPublic;
