import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Save, ArrowLeft, Plus, Copy, Trash } from 'lucide-react';
import QuestionTypeSelector from './QuestionTypeSelector';
import BlankQuestionEditor from './QuestionEditors/BlankQuestionEditor';
import DemographicsQuestionEditor from './QuestionEditors/DemographicsQuestionEditor';
import PrimaryInsuranceQuestionEditor from './QuestionEditors/PrimaryInsuranceQuestionEditor';
import SecondaryInsuranceQuestionEditor from './QuestionEditors/SecondaryInsuranceQuestionEditor';
import AllergiesQuestionEditor from './QuestionEditors/AllergiesQuestionEditor';
import QuestionSidebar from './QuestionSidebar';

interface FormItem {
  _id?: string;
  type: string;
  questionText: string;
  isRequired: boolean;
  placeholder?: string;
  instructions?: string;
  multipleLines?: boolean;
  options?: string[];
  matrix?: {
    rowHeader?: string;
    columnHeaders: string[];
    columnTypes: string[];
    rows: string[];
    dropdownOptions: string[][];
    displayTextBox: boolean;
  };
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

const FormBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formTemplate, setFormTemplate] = useState<FormTemplate>({
    title: '',
    description: '',
    isActive: true,
    isPublic: false,
    language: 'english',
    items: []
  });
  
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch form template if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchFormTemplate();
    }
  }, [id]);
  
  const fetchFormTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/form-templates/${id}`);
      setFormTemplate(response.data);
      
      // Select the first item if there are any
      if (response.data.items.length > 0) {
        setCurrentItemIndex(0);
      }
    } catch (error) {
      console.error('Error fetching form template:', error);
      toast.error('Failed to load form template');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormTemplate(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormTemplate(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const addNewQuestion = (questionType: string) => {
    let newItem: FormItem;
    
    switch (questionType) {
      case 'blank':
        newItem = {
          type: 'blank',
          questionText: 'Type your question text here',
          isRequired: false,
          placeholder: 'Enter your answer here',
          multipleLines: false
        };
        break;
      case 'demographics':
        newItem = {
          type: 'demographics',
          questionText: 'Demographics Information',
          isRequired: false,
          instructions: 'Please enter your information.',
          demographicFields: [
            { fieldName: 'First Name', fieldType: 'text', required: true },
            { fieldName: 'Middle Initials', fieldType: 'text', required: false },
            { fieldName: 'Last Name', fieldType: 'text', required: true },
            { fieldName: 'Date of Birth', fieldType: 'date', required: true },
            { fieldName: 'Gender', fieldType: 'dropdown', required: true, options: ['Female', 'Male', 'Non-Binary'] },
            { fieldName: 'Sex', fieldType: 'dropdown', required: true, options: ['Female', 'Male', 'Intersex'] },
            { fieldName: 'Marital Status', fieldType: 'dropdown', required: false, options: ['Single', 'Married', 'Domestic Partner', 'Separated', 'Divorced', 'Widowed'] },
            { fieldName: 'Street Address', fieldType: 'text', required: true },
            { fieldName: 'Apt/Unit #', fieldType: 'text', required: false },
            { fieldName: 'City', fieldType: 'text', required: true },
            { fieldName: 'State', fieldType: 'dropdown', required: true, options: ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'] },
            { fieldName: 'Zip Code', fieldType: 'text', required: true },
            { fieldName: 'Mobile Phone', fieldType: 'text', required: true },
            { fieldName: 'Home Phone', fieldType: 'text', required: false },
            { fieldName: 'Work Phone', fieldType: 'text', required: false },
            { fieldName: 'Email', fieldType: 'text', required: true },
            { fieldName: 'Preferred contact method', fieldType: 'dropdown', required: true, options: ['Mobile Phone', 'Home Phone', 'Work Phone', 'Email'] }
          ]
        };
        break;
      case 'primaryInsurance':
        newItem = {
          type: 'primaryInsurance',
          questionText: 'Primary Insurance Information',
          isRequired: false,
          instructions: 'Primary Insurance',
          insuranceFields: [
            { fieldName: 'Primary Insurance Company', fieldType: 'text', required: true },
            { fieldName: 'Member ID / Policy #', fieldType: 'text', required: true },
            { fieldName: 'Group Number', fieldType: 'text', required: false },
            { fieldName: 'Client Relationship to Insured', fieldType: 'dropdown', required: true, options: ['Self', 'Spouse', 'Child', 'Other'] },
            { fieldName: 'Insured Name', fieldType: 'text', required: false },
            { fieldName: 'Insured Phone #', fieldType: 'text', required: false },
            { fieldName: 'Insured Date of Birth', fieldType: 'date', required: false },
            { fieldName: 'Insured Sex', fieldType: 'dropdown', required: false, options: ['Female', 'Male'] },
            { fieldName: 'Insured Street Address', fieldType: 'text', required: false },
            { fieldName: 'Insured City', fieldType: 'text', required: false },
            { fieldName: 'Insured State', fieldType: 'dropdown', required: false, options: ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'] },
            { fieldName: 'Zip Code', fieldType: 'text', required: false }
          ]
        };
        break;
      case 'secondaryInsurance':
        newItem = {
          type: 'secondaryInsurance',
          questionText: 'Secondary Insurance Information',
          isRequired: false,
          instructions: 'Secondary Insurance',
          insuranceFields: [
            { fieldName: 'Secondary Insurance Company', fieldType: 'text', required: true },
            { fieldName: 'Member ID / Policy #', fieldType: 'text', required: true },
            { fieldName: 'Group Number', fieldType: 'text', required: false },
            { fieldName: 'Client Relationship to Insured', fieldType: 'dropdown', required: true, options: ['Self', 'Spouse', 'Child', 'Other'] },
            { fieldName: 'Insured Name', fieldType: 'text', required: false },
            { fieldName: 'Insured Phone #', fieldType: 'text', required: false },
            { fieldName: 'Insured Date of Birth', fieldType: 'date', required: false },
            { fieldName: 'Insured Sex', fieldType: 'dropdown', required: false, options: ['Female', 'Male'] },
            { fieldName: 'Insured Street Address', fieldType: 'text', required: false },
            { fieldName: 'Insured City', fieldType: 'text', required: false },
            { fieldName: 'Insured State', fieldType: 'dropdown', required: false, options: ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'] },
            { fieldName: 'Zip Code', fieldType: 'text', required: false }
          ]
        };
        break;
      case 'allergies':
        newItem = {
          type: 'allergies',
          questionText: 'Please enter the details of any allergies',
          isRequired: false,
          matrix: {
            rowHeader: 'Row Header (optional)',
            columnHeaders: ['Allergic To', 'Allergy Type', 'Reaction', 'Severity', 'Date of Onset', 'End Date'],
            columnTypes: ['text', 'dropdown', 'dropdown', 'dropdown', 'text', 'text'],
            rows: ['1', '2', '3'],
            dropdownOptions: [
              [], // No options for 'Allergic To' (text field)
              ['Food', 'Medication', 'Environmental', 'Other'], // Options for 'Allergy Type'
              ['Rash', 'Hives', 'Swelling', 'Anaphylaxis', 'GI Issues', 'Respiratory', 'Other'], // Options for 'Reaction'
              ['Mild', 'Moderate', 'Severe', 'Life-threatening'], // Options for 'Severity'
              [], // No options for 'Date of Onset' (text field)
              []  // No options for 'End Date' (text field)
            ],
            displayTextBox: true
          }
        };
        break;
      default:
        newItem = {
          type: 'blank',
          questionText: 'Type your question text here',
          isRequired: false,
          placeholder: 'Enter your answer here',
          multipleLines: false
        };
    }
    
    const updatedItems = [...formTemplate.items, newItem];
    setFormTemplate(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    // Select the newly added item
    setCurrentItemIndex(updatedItems.length - 1);
  };
  
  const updateQuestion = (index: number, updatedItem: FormItem) => {
    const updatedItems = [...formTemplate.items];
    updatedItems[index] = updatedItem;
    
    setFormTemplate(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  const duplicateQuestion = (index: number) => {
    const itemToDuplicate = { ...formTemplate.items[index] };
    // Remove _id if it exists to ensure a new one is generated
    if (itemToDuplicate._id) delete itemToDuplicate._id;
    
    const updatedItems = [
      ...formTemplate.items.slice(0, index + 1),
      itemToDuplicate,
      ...formTemplate.items.slice(index + 1)
    ];
    
    setFormTemplate(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    // Select the duplicated item
    setCurrentItemIndex(index + 1);
  };
  
  const deleteQuestion = (index: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedItems = formTemplate.items.filter((_, i) => i !== index);
      
      setFormTemplate(prev => ({
        ...prev,
        items: updatedItems
      }));
      
      // Update current item index
      if (currentItemIndex === index) {
        if (updatedItems.length > 0) {
          if (index < updatedItems.length) {
            setCurrentItemIndex(index);
          } else {
            setCurrentItemIndex(updatedItems.length - 1);
          }
        } else {
          setCurrentItemIndex(null);
        }
      } else if (currentItemIndex !== null && currentItemIndex > index) {
        setCurrentItemIndex(currentItemIndex - 1);
      }
    }
  };
  
  const saveFormTemplate = async () => {
    // Validate form
    if (!formTemplate.title.trim()) {
      toast.error('Form title is required');
      return;
    }
    
    if (formTemplate.items.length === 0) {
      toast.error('Form must have at least one question');
      return;
    }
    
    setIsSaving(true);
    
    try {
      let response;
      
      if (isEditMode) {
        response = await axios.put(`/api/form-templates/${id}`, formTemplate);
        toast.success('Form template updated successfully');
      } else {
        response = await axios.post('/api/form-templates', formTemplate);
        toast.success('Form template created successfully');
      }
      
      // Navigate to form templates list
      navigate('/forms/templates');
    } catch (error) {
      console.error('Error saving form template:', error);
      toast.error('Failed to save form template');
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderQuestionEditor = () => {
    if (currentItemIndex === null || !formTemplate.items[currentItemIndex]) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No question selected</p>
            <button
              onClick={() => addNewQuestion('blank')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Plus className="inline-block mr-2 h-4 w-4" />
              Add Question
            </button>
          </div>
        </div>
      );
    }
    
    const currentItem = formTemplate.items[currentItemIndex];
    
    switch (currentItem.type) {
      case 'blank':
        return (
          <BlankQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'demographics':
        return (
          <DemographicsQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'primaryInsurance':
        return (
          <PrimaryInsuranceQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'secondaryInsurance':
        return (
          <SecondaryInsuranceQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'allergies':
        return (
          <AllergiesQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      default:
        return <div>Unknown question type</div>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/forms/templates')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? 'Edit Form Template' : 'Create Form Template'}
          </h1>
        </div>
        <button
          onClick={saveFormTemplate}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isSaving ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </>
          )}
        </button>
      </div>
      
      {/* Form Details */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form Title*
            </label>
            <input
              type="text"
              name="title"
              value={formTemplate.title}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter form title"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              name="language"
              value={formTemplate.language}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="bilingual">Bilingual (English & Spanish)</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formTemplate.description}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter form description"
            />
          </div>
          
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formTemplate.isActive}
                onChange={(e) => setFormTemplate(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formTemplate.isPublic}
                onChange={(e) => setFormTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Public (visible to all users)
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Builder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Question Sidebar */}
        <div className="md:col-span-1">
          <QuestionSidebar
            items={formTemplate.items}
            currentItemIndex={currentItemIndex}
            onSelectItem={setCurrentItemIndex}
            onAddItem={addNewQuestion}
            onDuplicateItem={duplicateQuestion}
            onDeleteItem={deleteQuestion}
          />
        </div>
        
        {/* Question Editor */}
        <div className="md:col-span-3">
          {renderQuestionEditor()}
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;