import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionnairesSection from '../../components/forms/QuestionnairesSection';
import axios from 'axios';
import { toast } from 'react-toastify';

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
    <div className="container mx-auto px-4 py-8">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Custom Forms Section */}
          <QuestionnairesSection
            title="Custom Forms"
            forms={formTemplates.map(mapTemplateToForm)}
            onFormClick={handleFormClick}
            onCreateNew={handleCreateNew}
            onUploadExisting={handleUploadExisting}
          />
          
          {/* Questionnaires Section */}
          <QuestionnairesSection
            title="Questionnaires"
            forms={questionnaires}
            onFormClick={handleFormClick}
            onCreateNew={handleCreateNew}
            onUploadExisting={handleUploadExisting}
          />
          
          {/* Consent Forms Section */}
          <QuestionnairesSection
            title="Consent Forms"
            forms={consentForms}
            onFormClick={handleFormClick}
            onCreateNew={handleCreateNew}
            onUploadExisting={handleUploadExisting}
          />
        </>
      )}
    </div>
  );
};

export default QuestionnairesPage;