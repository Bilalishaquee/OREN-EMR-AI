import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionnairesSection from '../../components/forms/QuestionnairesSection';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FileText, Plus, Upload } from 'lucide-react';

interface FormTemplate {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  isPublic: boolean;
  language: string;
  items: any[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const QuestionnairesPage: React.FC = () => {
  const navigate = useNavigate();
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchFormTemplates();
  }, []);
  
  const fetchFormTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/form-templates');
      setFormTemplates(response.data);
    } catch (error) {
      console.error('Error fetching form templates:', error);
      toast.error('Failed to load form templates');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Convert form templates to the format expected by QuestionnairesSection
  const mapTemplateToForm = (template: FormTemplate) => {
    // Generate a color based on the template ID for visual variety
    const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
    const colorIndex = template._id.charCodeAt(0) % colors.length;
    
    return {
      id: template._id,
      title: template.title,
      color: colors[colorIndex],
      isShared: template.isPublic,
      isPdf: false
    };
  };
  
  // Sample data for questionnaires
  const questionnaires = [
    {
      id: 'new-patient-form',
      title: 'New Patient Form',
      color: 'bg-purple-500',
      isShared: true
    },
    {
      id: 'dash-score',
      title: 'Dash Score',
      color: 'bg-yellow-500',
      isShared: true
    },
    {
      id: 'new-patient-personal-injury',
      title: 'New Patient Personal Injury',
      color: 'bg-blue-500',
      isShared: true
    },
    {
      id: 'new-patient-workers-compensation',
      title: 'New Patient Workers Compensation',
      color: 'bg-green-500',
      isShared: true
    },
    {
      id: 'carecredit-optional-finance-option',
      title: 'CareCredit Optional Finance Option',
      color: 'bg-red-500',
      isShared: true
    }
  ];
  
  // Sample data for consent forms
  const consentForms = [
    {
      id: 'assignment-of-benefits',
      title: 'Assignment Of Benefits',
      color: 'bg-purple-500',
      isShared: true
    },
    {
      id: 'no-show-policy-financial-responsibilities-agreement-spanish',
      title: 'No Show Policy & Financial Responsibilities Agreement Spanish',
      color: 'bg-yellow-500',
      isShared: true
    },
    {
      id: 'medicare-private-contract',
      title: 'Medicare Private Contract',
      color: 'bg-blue-500',
      isShared: true
    },
    {
      id: 'designation-of-authorized-representative',
      title: 'Designation Of Authorized Representative',
      color: 'bg-green-500',
      isShared: true,
      isPdf: true
    },
    {
      id: 'bactrim-consent',
      title: 'Bactrim Consent',
      color: 'bg-red-500',
      isShared: true
    },
    {
      id: 'bactrim-consent-spanish',
      title: 'Bactrim Consent Spanish',
      color: 'bg-purple-500',
      isShared: true
    },
    {
      id: 'assignment-of-benefits-spanish',
      title: 'Assignment Of Benefits - Spanish',
      color: 'bg-yellow-500',
      isShared: true
    },
    {
      id: 'no-show-policy-financial-responsibilities-agreement',
      title: 'No Show Policy & Financial Responsibilities Agreement',
      color: 'bg-blue-500',
      isShared: true
    },
    {
      id: 'no-show-policy-spanish',
      title: 'No Show Policy Spanish',
      color: 'bg-green-500',
      isShared: true
    }
  ];

  const handleFormClick = (formId: string) => {
    // Handle form click - navigate to form or open it
    console.log(`Form clicked: ${formId}`);
    
    // If the clicked form is the New Patient Form, navigate to the new patient intake form
    if (formId === 'new-patient-form') {
      // Find the first form template that has "New Patient" in the title
      const newPatientTemplate = formTemplates.find(template => 
        template.title.toLowerCase().includes('new patient') && template.isActive
      );
      
      if (newPatientTemplate) {
        navigate(`/forms/templates/${newPatientTemplate._id}/builder`);
      } else {
        // If no template is found, navigate to the form builder to create one
        navigate('/forms/templates/new?newPatient=true');
      }
    } else if (formId.length === 24) {
      // This is likely a MongoDB ObjectId, so navigate to the form template
      navigate(`/forms/templates/${formId}/builder`);
    } else {
      // For other forms, we'll implement this later
      toast.info('This form is not yet implemented');
    }
  };

  const handleCreateNew = () => {
    // Handle create new form
    navigate('/forms/templates/new');
  };

  const handleUploadExisting = () => {
    // Handle upload existing form
    navigate('/forms/templates');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MY FORMS</h1>
              <p className="text-sm text-gray-600">Manage and access all your custom forms and questionnaires</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUploadExisting}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Form
              </button>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading forms...</p>
          </div>
        ) : (
          <>
            {/* Custom Forms Section */}
            {formTemplates.length > 0 ? (
              <QuestionnairesSection
                title="Custom Forms"
                forms={formTemplates.map(mapTemplateToForm)}
                onFormClick={handleFormClick}
                onCreateNew={handleCreateNew}
                onUploadExisting={handleUploadExisting}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="flex justify-center mb-4">
                    <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-10 w-10 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No forms found</h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first custom form.
                  </p>
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Form
                  </button>
                </div>
              </div>
            )}
            
            {/* Questionnaires Section */}
            {/* <QuestionnairesSection
              title="Questionnaires"
              forms={questionnaires}
              onFormClick={handleFormClick}
              onCreateNew={handleCreateNew}
              onUploadExisting={handleUploadExisting}
            /> */}
            
            {/* Consent Forms Section */}
            {/* <QuestionnairesSection
              title="Consent Forms"
              forms={consentForms}
              onFormClick={handleFormClick}
              onCreateNew={handleCreateNew}
              onUploadExisting={handleUploadExisting}
            /> */}
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionnairesPage;