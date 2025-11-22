import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface Section {
  sectionId: string;
  sectionName: string;
  fields: Field[];
}

interface Field {
  fieldName: string;
  fieldType: string;
  fieldValue: any;
  options?: string[];
  matrixValues?: MatrixValue[];
  fileData?: FileData;
}

interface MatrixValue {
  rowName: string;
  columnName: string;
  value: any;
}

interface FileData {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date;
}

interface IntakeFormData {
  patient: string;
  sections: Section[];
  formVersion?: string;
  status: 'incomplete' | 'completed' | 'reviewed';
}

const DynamicIntakeForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<IntakeFormData>({
    patient: patientId || '',
    sections: [],
    status: 'incomplete'
  });
  
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Example sections for the intake form
  const initialSections: Section[] = [
    {
      sectionId: 'demographics',
      sectionName: 'Patient Demographics',
      fields: [
        {
          fieldName: 'preferredLanguage',
          fieldType: 'dropdown',
          fieldValue: '',
          options: ['English', 'Spanish', 'Other']
        },
        {
          fieldName: 'maritalStatus',
          fieldType: 'dropdown',
          fieldValue: '',
          options: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated']
        },
        {
          fieldName: 'occupation',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'emergencyContact',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'emergencyContactPhone',
          fieldType: 'text',
          fieldValue: ''
        }
      ]
    },
    {
      sectionId: 'primaryInsurance',
      sectionName: 'Primary Insurance',
      fields: [
        {
          fieldName: 'insuranceProvider',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'policyNumber',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'groupNumber',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'policyHolderName',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'policyHolderRelationship',
          fieldType: 'dropdown',
          fieldValue: '',
          options: ['Self', 'Spouse', 'Parent', 'Other']
        },
        {
          fieldName: 'policyHolderDateOfBirth',
          fieldType: 'text',
          fieldValue: ''
        }
      ]
    },
    {
      sectionId: 'secondaryInsurance',
      sectionName: 'Secondary Insurance',
      fields: [
        {
          fieldName: 'hasSecondaryInsurance',
          fieldType: 'radio',
          fieldValue: '',
          options: ['Yes', 'No']
        },
        {
          fieldName: 'insuranceProvider',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'policyNumber',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'groupNumber',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'policyHolderName',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'policyHolderRelationship',
          fieldType: 'dropdown',
          fieldValue: '',
          options: ['Self', 'Spouse', 'Parent', 'Other']
        },
        {
          fieldName: 'policyHolderDateOfBirth',
          fieldType: 'text',
          fieldValue: ''
        }
      ]
    },
    {
      sectionId: 'medicalHistory',
      sectionName: 'Medical History',
      fields: [
        {
          fieldName: 'allergies',
          fieldType: 'multiselect',
          fieldValue: [],
          options: ['Penicillin', 'Sulfa Drugs', 'Aspirin', 'Ibuprofen', 'Latex', 'None', 'Other']
        },
        {
          fieldName: 'otherAllergies',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'medications',
          fieldType: 'textarea',
          fieldValue: ''
        },
        {
          fieldName: 'conditions',
          fieldType: 'multiselect',
          fieldValue: [],
          options: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Cancer', 'None', 'Other']
        },
        {
          fieldName: 'otherConditions',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'surgeries',
          fieldType: 'textarea',
          fieldValue: ''
        },
        {
          fieldName: 'familyHistory',
          fieldType: 'textarea',
          fieldValue: ''
        }
      ]
    },
    {
      sectionId: 'painAssessment',
      sectionName: 'Pain Assessment',
      fields: [
        {
          fieldName: 'bodyPart',
          fieldType: 'bodyMap',
          fieldValue: []
        },
        {
          fieldName: 'painLevel',
          fieldType: 'slider',
          fieldValue: 0
        },
        {
          fieldName: 'painQuality',
          fieldType: 'multiselect',
          fieldValue: [],
          options: ['Sharp', 'Dull', 'Aching', 'Burning', 'Throbbing', 'Stabbing', 'Other']
        },
        {
          fieldName: 'painFrequency',
          fieldType: 'radio',
          fieldValue: '',
          options: ['Constant', 'Intermittent', 'Occasional', 'Rare']
        },
        {
          fieldName: 'painDuration',
          fieldType: 'text',
          fieldValue: ''
        },
        {
          fieldName: 'symptoms',
          fieldType: 'multiselect',
          fieldValue: [],
          options: ['Swelling', 'Redness', 'Warmth', 'Numbness', 'Tingling', 'Weakness', 'Other']
        }
      ]
    }
  ];
  
  useEffect(() => {
    const fetchPatientInfo = async () => {
      try {
        if (patientId) {
          const response = await axios.get(`/api/patients/${patientId}`);
          setPatientInfo(response.data);
        }
      } catch (error) {
        console.error('Error fetching patient info:', error);
        toast.error('Failed to load patient information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientInfo();
    setFormData(prev => ({
      ...prev,
      sections: initialSections
    }));
  }, [patientId]);
  
  const handleFieldChange = (sectionIndex: number, fieldIndex: number, value: any) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].fields[fieldIndex].fieldValue = value;
    
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };
  
  const renderField = (field: Field, sectionIndex: number, fieldIndex: number) => {
    switch (field.fieldType) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={field.fieldValue || ''}
            onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
          />
        );
        
      case 'textarea':
        return (
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={field.fieldValue || ''}
            onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
            rows={4}
          />
        );
        
      case 'dropdown':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={field.fieldValue || ''}
            onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );
        
      case 'radio':
        return (
          <div className="flex flex-col space-y-2">
            {field.options?.map((option, i) => (
              <label key={i} className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  checked={field.fieldValue === option}
                  onChange={() => handleFieldChange(sectionIndex, fieldIndex, option)}
                />
                <span className="ml-2">{option}</span>
              </label>
            ))}
          </div>
        );
        
      case 'multiselect':
        return (
          <div className="flex flex-col space-y-2">
            {field.options?.map((option, i) => (
              <label key={i} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600"
                  checked={Array.isArray(field.fieldValue) && field.fieldValue.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(field.fieldValue) ? [...field.fieldValue] : [];
                    if (e.target.checked) {
                      currentValues.push(option);
                    } else {
                      const index = currentValues.indexOf(option);
                      if (index !== -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    handleFieldChange(sectionIndex, fieldIndex, currentValues);
                  }}
                />
                <span className="ml-2">{option}</span>
              </label>
            ))}
          </div>
        );
        
      case 'slider':
        return (
          <div className="flex flex-col space-y-2">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              className="w-full"
              value={field.fieldValue || 0}
              onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, parseInt(e.target.value))}
            />
            <div className="flex justify-between">
              <span>0 (No Pain)</span>
              <span>{field.fieldValue || 0}</span>
              <span>10 (Worst Pain)</span>
            </div>
          </div>
        );
        
      case 'bodyMap':
        // This would be a placeholder for a more complex body map component
        return (
          <div className="border border-gray-300 rounded-md p-4 text-center">
            <p>Body Map Component Placeholder</p>
            <p>This would be replaced with an interactive body map where patients can mark areas of pain/discomfort</p>
          </div>
        );
        
      default:
        return <p>Unsupported field type: {field.fieldType}</p>;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      toast.error('Patient ID is required');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Set status to completed when submitting
      const dataToSubmit = {
        ...formData,
        status: 'completed' as const
      };
      
      const response = await axios.post('/api/intake-form-data', dataToSubmit);
      
      toast.success('Intake form submitted successfully');
      navigate(`/patients/${patientId}`);
    } catch (error) {
      console.error('Error submitting intake form:', error);
      toast.error('Failed to submit intake form');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Patient Intake Form</h1>
      
      {patientInfo && (
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-2">Patient Information</h2>
          <p><strong>Name:</strong> {patientInfo.firstName} {patientInfo.lastName}</p>
          <p><strong>DOB:</strong> {patientInfo.dateOfBirth}</p>
          <p><strong>Gender:</strong> {patientInfo.gender}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {formData.sections.map((section, sectionIndex) => (
          <div key={section.sectionId} className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">
              {section.sectionName}
            </h2>
            
            <div className="space-y-6">
              {section.fields.map((field, fieldIndex) => (
                <div key={field.fieldName} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.fieldName}
                  </label>
                  {renderField(field, sectionIndex, fieldIndex)}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="flex justify-end mt-6 space-x-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => navigate(`/patients/${patientId}`)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DynamicIntakeForm;