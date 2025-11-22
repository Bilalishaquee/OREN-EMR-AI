import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Send, Eye, Download, Edit } from 'lucide-react';
import SendFormModal, { SendFormData } from '../../components/forms/SendFormModal';

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

const PatientIntakeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchFormTemplate();
    }
  }, [id]);
  
  const fetchFormTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/form-templates/${id}`);
      setTemplate(response.data);
    } catch (error) {
      console.error('Error fetching form template:', error);
      toast.error('Failed to load form template');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendForm = async (data: SendFormData) => {
    try {
      const response = await axios.post('/api/patients/send-to-client', {
        email: data.clientEmail,
        name: data.clientName,
        instructions: data.instructions,
        language: template?.language || 'english',
        formTemplateId: template?._id
      });
      
      toast.success('Form sent successfully to client');
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending form:', error);
      return Promise.reject(error);
    }
  };
  
  const previewForm = () => {
    // Navigate to form preview page
    navigate(`/forms/templates/${id}/preview`);
  };
  
  const downloadPDF = () => {
    // In a real implementation, this would generate and download a PDF of the form
    toast.info('PDF download functionality would be implemented here');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">Form template not found</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/forms/templates')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <button
            onClick={() => navigate('/forms/templates')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{template.title}</h1>
            <p className="text-gray-600">
              {template.description || 'No description provided'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/forms/templates/${id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </button>
          <button
            onClick={previewForm}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </button>
          <button
            onClick={downloadPDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Send className="mr-2 h-4 w-4" />
            Send to Patient
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6 border-b pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Visibility</h3>
              <p className="mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  template.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {template.isPublic ? 'Public' : 'Private'}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Language</h3>
              <p className="mt-1 text-gray-900">
                {template.language === 'english' ? 'English' : 
                 template.language === 'spanish' ? 'Spanish' : 
                 'Bilingual (English & Spanish)'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Form Questions</h2>
          <div className="space-y-6">
            {template.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">
                      {item.questionText || `Question ${index + 1}`}
                      {item.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.type === 'blank' || item.type === 'openAnswer' ? 'Open Answer Question' : 
                       item.type === 'demographics' ? 'Demographics' :
                       item.type === 'primaryInsurance' ? 'Primary Insurance' :
                       item.type === 'secondaryInsurance' ? 'Secondary Insurance' :
                       item.type === 'allergies' ? 'Allergies' : 
                       item.type}
                    </p>
                  </div>
                </div>
                
                {(item.type === 'blank' || item.type === 'openAnswer') && (
                  <div className="mt-2">
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <p className="text-sm text-gray-500">
                        {item.multipleLines ? 'Multiple line text field' : 'Single line text field'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Placeholder: {item.placeholder || 'None'}
                      </p>
                    </div>
                  </div>
                )}
                
                {item.type === 'demographics' && (
                  <div className="mt-2">
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <p className="text-sm text-gray-500">
                        Demographics fields: {item.demographicFields?.length || 0} fields
                      </p>
                      {item.instructions && (
                        <p className="text-xs text-gray-400 mt-1">
                          Instructions: {item.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {(item.type === 'primaryInsurance' || item.type === 'secondaryInsurance') && (
                  <div className="mt-2">
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <p className="text-sm text-gray-500">
                        Insurance fields: {item.insuranceFields?.length || 0} fields
                      </p>
                      {item.instructions && (
                        <p className="text-xs text-gray-400 mt-1">
                          Instructions: {item.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {item.type === 'allergies' && (
                  <div className="mt-2">
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <p className="text-sm text-gray-500">
                        Matrix with {item.matrix?.columnHeaders.length || 0} columns and {item.matrix?.rows.length || 0} rows
                      </p>
                      {item.matrix?.displayTextBox && (
                        <p className="text-xs text-gray-400 mt-1">
                          Includes text box for additional explanation
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 text-sm text-gray-500">
          <p>Created by: {template.createdBy ? `${template.createdBy.firstName} ${template.createdBy.lastName}` : 'Unknown'}</p>
          <p>Last updated: {new Date(template.updatedAt).toLocaleString()}</p>
        </div>
      </div>
      
      {/* Send Form Modal */}
      <SendFormModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={handleSendForm}
      />
    </div>
  );
};

export default PatientIntakeFormPage;