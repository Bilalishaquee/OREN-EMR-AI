import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Save, ArrowLeft, Plus, Copy, Trash, AlignLeft, Menu } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import QuestionButton from './QuestionButton';
import QuestionTypeSelector from './QuestionTypeSelector';
import BlankQuestionEditor from './QuestionEditors/BlankQuestionEditor';
import DemographicsQuestionEditor from './QuestionEditors/DemographicsQuestionEditor';
import PrimaryInsuranceQuestionEditor from './QuestionEditors/PrimaryInsuranceQuestionEditor';
import SecondaryInsuranceQuestionEditor from './QuestionEditors/SecondaryInsuranceQuestionEditor';
import AllergiesQuestionEditor from './QuestionEditors/AllergiesQuestionEditor';
import QuestionSidebar from './QuestionSidebar';

// Import new question editor components
import MixedControlsQuestionEditor from './QuestionEditors/MixedControlsQuestionEditor';
import MultipleChoiceSingleQuestionEditor from './QuestionEditors/MultipleChoiceSingleQuestionEditor';
import MultipleChoiceMultipleQuestionEditor from './QuestionEditors/MultipleChoiceMultipleQuestionEditor';
import MatrixQuestionEditor from './QuestionEditors/MatrixQuestionEditor';
import MatrixSingleAnswerQuestionEditor from './QuestionEditors/MatrixSingleAnswerQuestionEditor';
import SectionTitleQuestionEditor from './QuestionEditors/SectionTitleQuestionEditor';
import FileAttachmentQuestionEditor from './QuestionEditors/FileAttachmentQuestionEditor';
import ESignatureQuestionEditor from './QuestionEditors/ESignatureQuestionEditor';
import SmartEditorQuestionEditor from './QuestionEditors/SmartEditorQuestionEditor';
import BodyMapQuestionEditor from './QuestionEditors/BodyMapQuestionEditor';
import OpenAnswerQuestionEditor from './QuestionEditors/OpenAnswerQuestionEditor';

interface FormItem {
  _id?: string;
  id?: string; // Added id field to match PatientIntakeFormPreview expectations
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
    allowMultipleAnswers?: boolean;
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
  mixedControlsConfig?: {
    controlType: string;
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
  }[];
  sectionContent?: string;
  fileTypes?: string[];
  maxFileSize?: number;
  signaturePrompt?: string;
  editorContent?: string;
  bodyMapType?: string;
  allowPatientMarkings?: boolean;
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
  
  // Ensure all form items have valid string IDs
  useEffect(() => {
    // Skip if no items yet or if items array is not properly initialized
    if (!formTemplate.items || formTemplate.items.length === 0) return;
    
    console.log('Validating item IDs:', formTemplate.items);
    
    // Create a Set to track used IDs and ensure uniqueness
    const usedIds = new Set();
    let hasChanges = false;
    
    // Create a copy of the items array and ensure all items have valid string IDs
    const updatedItems = formTemplate.items.map((item, index) => {
      // Handle null or undefined items (shouldn't happen, but just in case)
      if (!item) {
        console.error('Found null or undefined item in formTemplate.items at index', index);
        hasChanges = true;
        const newItem = {
          id: generateUniqueId(),
          type: 'blank',
          questionText: '',
          isRequired: false
        };
        usedIds.add(newItem.id);
        return newItem;
      }
      
      if (!item.id) {
        // Generate a new ID for items without an ID
        const newId = generateUniqueId();
        console.log(`Missing ID - Assigning new ID ${newId} to item at index ${index}:`, item);
        usedIds.add(newId);
        hasChanges = true;
        return { ...item, id: newId };
      } else if (typeof item.id !== 'string') {
        // Convert non-string IDs to strings
        const stringId = String(item.id);
        console.log(`Non-string ID - Converting ID ${item.id} to string for item at index ${index}:`, item);
        
        // Check if the string ID is already used
        if (usedIds.has(stringId)) {
          const newId = generateUniqueId();
          console.log(`Duplicate ID after conversion - Assigning new ID ${newId} to item at index ${index}:`, item);
          usedIds.add(newId);
          hasChanges = true;
          return { ...item, id: newId };
        }
        
        usedIds.add(stringId);
        hasChanges = true;
        return { ...item, id: stringId };
      } else if (usedIds.has(item.id)) {
        // Handle duplicate IDs
        const newId = generateUniqueId();
        console.log(`Duplicate ID - Assigning new ID ${newId} to item at index ${index}:`, item);
        usedIds.add(newId);
        hasChanges = true;
        return { ...item, id: newId };
      }
      
      // Add the existing ID to the used IDs set
      usedIds.add(item.id);
      return item;
    });
    
    // Only update if changes were made
    if (hasChanges) {
      console.log('Updating items with valid string IDs:', updatedItems);
      setFormTemplate(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  }, [formTemplate.items]);  // Run when items array changes (not just length)
  
  const fetchFormTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/form-templates/${id}`);
      
      console.log('Original items from API:', response.data.items);
      
      // Create a Set to track used IDs and ensure uniqueness
      const usedIds = new Set();
      
      // Ensure each item has a client-side id for drag and drop functionality
      const itemsWithIds = response.data.items.map((item, index) => {
        // If item has no id or id is already used (duplicate), generate a new one
        if (!item.id || usedIds.has(item.id)) {
          const newId = generateUniqueId();
          console.log(`${!item.id ? 'Missing ID' : 'Duplicate ID'} - Assigning new ID ${newId} to item at index ${index}:`, item);
          
          // Add the new ID to the used IDs set
          usedIds.add(newId);
          
          return {
            ...item,
            id: newId
          };
        }
        
        // Add the existing ID to the used IDs set
        usedIds.add(item.id);
        console.log(`Item at index ${index} already has ID ${item.id}:`, item);
        return item;
      });
      
      // Verify all items have valid IDs
      const allItemsHaveIds = itemsWithIds.every((item, index) => {
        if (!item.id) {
          console.error(`ERROR: Item at index ${index} still has no ID after processing:`, item);
          return false;
        }
        return true;
      });
      
      if (!allItemsHaveIds) {
        console.error('Some items are missing IDs after processing!');
        toast.error('Error processing form items');
      }
      
      console.log('Items with IDs:', itemsWithIds);
      console.log('Used IDs:', Array.from(usedIds));
      
      setFormTemplate({
        ...response.data,
        items: itemsWithIds
      });
      
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
  
  // Helper function to generate a unique ID
  const generateUniqueId = () => {
    const uniqueId = 'q_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log('Generated new unique ID:', uniqueId);
    return uniqueId;
  };
  
  // Function to create a new question item without adding it to the form
  const createNewQuestion = (questionType: string): FormItem => {
    const uniqueId = generateUniqueId();
    let newItem: FormItem;
    
    switch (questionType) {
      case 'blank':
      case 'openAnswer':
        newItem = {
          id: uniqueId,
          type: 'openAnswer',
          questionText: 'Type your question text here',
          isRequired: false,
          placeholder: 'Enter your answer here',
          multipleLines: false
        };
        break;
      case 'demographics':
        newItem = {
          id: uniqueId,
          type: 'demographics',
          questionText: 'Demographics',
          isRequired: false,
          demographicFields: [
            { fieldName: 'First Name', fieldType: 'text', required: true },
            { fieldName: 'Last Name', fieldType: 'text', required: true },
            { fieldName: 'Date of Birth', fieldType: 'date', required: true },
            { fieldName: 'Gender', fieldType: 'select', required: true, options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
            { fieldName: 'Phone', fieldType: 'phone', required: true },
            { fieldName: 'Email', fieldType: 'email', required: true },
            { fieldName: 'Address', fieldType: 'text', required: true },
            { fieldName: 'City', fieldType: 'text', required: true },
            { fieldName: 'State', fieldType: 'select', required: true, options: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'] },
            { fieldName: 'ZIP Code', fieldType: 'text', required: true }
          ]
        };
        break;
      case 'primaryInsurance':
        newItem = {
          id: uniqueId,
          type: 'primaryInsurance',
          questionText: 'Primary Insurance',
          isRequired: false,
          insuranceFields: [
            { fieldName: 'Insurance Provider', fieldType: 'text', required: true },
            { fieldName: 'Member ID', fieldType: 'text', required: true },
            { fieldName: 'Group Number', fieldType: 'text', required: false },
            { fieldName: 'Plan Type', fieldType: 'select', required: true, options: ['HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'Other'] },
            { fieldName: 'Policyholder Name', fieldType: 'text', required: true },
            { fieldName: 'Relationship to Policyholder', fieldType: 'select', required: true, options: ['Self', 'Spouse', 'Child', 'Other'] },
            { fieldName: 'Policyholder Date of Birth', fieldType: 'date', required: true }
          ]
        };
        break;
      case 'secondaryInsurance':
        newItem = {
          id: uniqueId,
          type: 'secondaryInsurance',
          questionText: 'Secondary Insurance',
          isRequired: false,
          insuranceFields: [
            { fieldName: 'Insurance Provider', fieldType: 'text', required: true },
            { fieldName: 'Member ID', fieldType: 'text', required: true },
            { fieldName: 'Group Number', fieldType: 'text', required: false },
            { fieldName: 'Plan Type', fieldType: 'select', required: true, options: ['HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'Other'] },
            { fieldName: 'Policyholder Name', fieldType: 'text', required: true },
            { fieldName: 'Relationship to Policyholder', fieldType: 'select', required: true, options: ['Self', 'Spouse', 'Child', 'Other'] },
            { fieldName: 'Policyholder Date of Birth', fieldType: 'date', required: true }
          ]
        };
        break;
      case 'allergies':
        newItem = {
          id: uniqueId,
          type: 'allergies',
          questionText: 'Allergies',
          isRequired: false
        };
        break;
      case 'mixedControls':
        newItem = {
          id: uniqueId,
          type: 'mixedControls',
          questionText: 'Mixed Controls Question',
          isRequired: false,
          mixedControlsConfig: [
            { controlType: 'text', label: 'Text Field', required: false, placeholder: 'Enter text here' },
            { controlType: 'select', label: 'Dropdown', required: false, options: ['Option 1', 'Option 2', 'Option 3'] }
          ]
        };
        break;
      case 'multipleChoiceSingle':
        newItem = {
          id: uniqueId,
          type: 'multipleChoiceSingle',
          questionText: 'Multiple Choice Question',
          isRequired: false,
          options: ['Option 1', 'Option 2', 'Option 3']
        };
        break;
      case 'multipleChoiceMultiple':
        newItem = {
          id: uniqueId,
          type: 'multipleChoiceMultiple',
          questionText: 'Multiple Choice Question (Select Multiple)',
          isRequired: false,
          options: ['Option 1', 'Option 2', 'Option 3']
        };
        break;
      case 'matrix':
        newItem = {
          id: uniqueId,
          type: 'matrix',
          questionText: 'Matrix Question',
          isRequired: false,
          matrix: {
            rowHeader: 'Questions',
            columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
            columnTypes: ['radio', 'radio', 'radio'],
            rows: ['Row 1', 'Row 2', 'Row 3'],
            dropdownOptions: [[], [], []],
            displayTextBox: false
          }
        };
        break;
      case 'matrixSingleAnswer':
        newItem = {
          id: uniqueId,
          type: 'matrixSingleAnswer',
          questionText: 'Matrix Question (Single Answer per Row)',
          isRequired: false,
          matrix: {
            rowHeader: 'Questions',
            columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
            columnTypes: ['radio', 'radio', 'radio'],
            rows: ['Row 1', 'Row 2', 'Row 3'],
            dropdownOptions: [[], [], []],
            displayTextBox: false,
            allowMultipleAnswers: false
          }
        };
        break;
      case 'sectionTitle':
        newItem = {
          id: uniqueId,
          type: 'sectionTitle',
          questionText: 'Section Title',
          isRequired: false,
          sectionContent: '<p>Add section description or instructions here...</p>'
        };
        break;
      case 'fileAttachment':
        newItem = {
          id: uniqueId,
          type: 'fileAttachment',
          questionText: 'File Attachment',
          isRequired: false,
          fileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx'],
          maxFileSize: 5
        };
        break;
      case 'eSignature':
        newItem = {
          id: uniqueId,
          type: 'eSignature',
          questionText: 'Signature',
          isRequired: false,
          signaturePrompt: 'Please sign below to confirm your agreement.'
        };
        break;
      case 'smartEditor':
        newItem = {
          id: uniqueId,
          type: 'smartEditor',
          questionText: 'Smart Editor',
          isRequired: false,
          editorContent: '<p>Enter your content here...</p>'
        };
        break;
      case 'bodyMap':
        newItem = {
          id: uniqueId,
          type: 'bodyMap',
          questionText: 'Body Map / Drawing',
          isRequired: false,
          bodyMapType: 'fullBody',
          allowPatientMarkings: true
        };
        break;
      default:
        // Handle unknown question types
        newItem = {
          id: uniqueId,
          type: questionType, // Use the provided type
          questionText: 'Type your question text here',
          isRequired: false
        };
    }
    
    return newItem;
  };

  const addNewQuestion = (questionType: string) => {
    let newItem: FormItem;
    
    // Generate a unique ID for the new question
    const uniqueId = generateUniqueId();
    console.log(`Adding new question of type '${questionType}' with ID: ${uniqueId}`);
    
    // Verify the ID doesn't already exist in the form items
    const idExists = formTemplate.items.some(item => item.id === uniqueId);
    if (idExists) {
      console.error(`Generated ID ${uniqueId} already exists in form items! Generating a new one.`);
      // Generate a new ID if there's a collision (extremely unlikely but possible)
      const newUniqueId = generateUniqueId();
      console.log(`New ID generated: ${newUniqueId}`);
    }
    
    switch (questionType) {
      case 'blank': // Keep for backward compatibility
      case 'openAnswer':
        newItem = {
          id: uniqueId,
          type: 'openAnswer',
          questionText: 'Type your question text here',
          isRequired: false,
          placeholder: 'Enter your answer here',
          multipleLines: false
        };
        break;
      case 'demographics':
        newItem = {
          id: uniqueId,
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
          id: uniqueId,
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
          id: uniqueId,
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
          id: uniqueId,
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
      case 'mixedControls':
        newItem = {
          id: uniqueId,
          type: 'mixedControls',
          questionText: 'Mixed Controls Question',
          isRequired: false,
          instructions: 'Please fill out all fields below.',
          mixedControlsConfig: [
            { controlType: 'text', label: 'Text Field', required: false, placeholder: 'Enter text here' },
            { controlType: 'dropdown', label: 'Dropdown Field', required: false, options: ['Option 1', 'Option 2', 'Option 3'] }
          ]
        };
        break;
      case 'openAnswer':
        newItem = {
          id: uniqueId,
          type: 'openAnswer',
          questionText: 'Type your question text here',
          isRequired: false,
          placeholder: 'Enter your answer here',
          multipleLines: false
        };
        break;
      case 'multipleChoiceSingle':
        newItem = {
          id: uniqueId,
          type: 'multipleChoiceSingle',
          questionText: 'Multiple Choice Question',
          isRequired: false,
          options: ['Option 1', 'Option 2', 'Option 3']
        };
        break;
      case 'multipleChoiceMultiple':
        newItem = {
          id: uniqueId,
          type: 'multipleChoiceMultiple',
          questionText: 'Multiple Choice Question (Select all that apply)',
          isRequired: false,
          options: ['Option 1', 'Option 2', 'Option 3']
        };
        break;
      case 'matrix':
        newItem = {
          id: uniqueId,
          type: 'matrix',
          questionText: 'Matrix Question',
          isRequired: false,
          matrix: {
            rowHeader: 'Questions',
            columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
            columnTypes: ['checkbox', 'checkbox', 'checkbox'],
            rows: ['Row 1', 'Row 2', 'Row 3'],
            dropdownOptions: [[], [], []],
            displayTextBox: false,
            allowMultipleAnswers: true
          }
        };
        break;
      case 'matrixSingleAnswer':
        newItem = {
          id: uniqueId,
          type: 'matrixSingleAnswer',
          questionText: 'Matrix Question (Single Answer per Row)',
          isRequired: false,
          matrix: {
            rowHeader: 'Questions',
            columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
            columnTypes: ['radio', 'radio', 'radio'],
            rows: ['Row 1', 'Row 2', 'Row 3'],
            dropdownOptions: [[], [], []],
            displayTextBox: false,
            allowMultipleAnswers: false
          }
        };
        break;
      case 'sectionTitle':
        newItem = {
          id: uniqueId,
          type: 'sectionTitle',
          questionText: 'Section Title',
          isRequired: false,
          sectionContent: 'Add additional information or instructions here.'
        };
        break;
      case 'fileAttachment':
        newItem = {
          id: uniqueId,
          type: 'fileAttachment',
          questionText: 'File Attachment',
          isRequired: false,
          fileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx'],
          maxFileSize: 5 * 1024 * 1024 // 5MB
        };
        break;
      case 'eSignature':
        newItem = {
          id: uniqueId,
          type: 'eSignature',
          questionText: 'Signature',
          isRequired: false,
          signaturePrompt: 'Please sign below to confirm your agreement.'
        };
        break;
      case 'smartEditor':
        newItem = {
          id: uniqueId,
          type: 'smartEditor',
          questionText: 'Smart Editor',
          isRequired: false,
          editorContent: '<p>Enter your content here...</p>'
        };
        break;
      case 'bodyMap':
        newItem = {
          id: uniqueId,
          type: 'bodyMap',
          questionText: 'Body Map / Drawing',
          isRequired: false,
          bodyMapType: 'fullBody',
          allowPatientMarkings: true
        };
        break;
      default:
        // Handle unknown question types
        newItem = {
          id: uniqueId,
          type: questionType as FormItemType, // Use the provided type
          questionText: 'Type your question text here',
          isRequired: false
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
    // Generate a new id for the duplicated question
    itemToDuplicate.id = generateUniqueId();
    
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

  // Handle drag end event for reordering questions
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    console.log('Drag end event:', result);
    console.log('Draggable ID:', draggableId);
    console.log('Source index:', source.index, 'Destination index:', destination?.index);
    console.log('Source droppableId:', source.droppableId, 'Destination droppableId:', destination?.droppableId);
    
    // If there's no destination, do nothing
    if (!destination) {
      console.log('No destination, no changes made');
      return;
    }
    
    try {
      // Handle case where draggableId starts with 'preview_'
      // This indicates a new item being dragged from the question type selector
      if (draggableId.startsWith('preview_')) {
        console.log('Handling preview item drag with ID:', draggableId);
        // Extract the question type from the draggableId
        const questionType = draggableId.replace('preview_', '');
        if (questionType) {
          // Add a new question of this type at the destination index if possible
          const newItem = createNewQuestion(questionType);
          const updatedItems = [...formTemplate.items];
          
          // Insert the new item at the destination index
          if (destination.droppableId === 'question-list') {
            updatedItems.splice(destination.index, 0, newItem);
            setFormTemplate(prev => ({
              ...prev,
              items: updatedItems
            }));
            
            // Select the newly added item
            setCurrentItemIndex(destination.index);
          } else {
            // Fallback to just adding at the end if not dropped in the question list
            addNewQuestion(questionType);
          }
          return;
        }
      }
      
      // If the item is dropped in the same place, do nothing
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        console.log('Same position, no changes made');
        return;
      }
      
      // Verify source index is valid
      if (source.index >= formTemplate.items.length) {
        console.error(`ERROR: Source index ${source.index} is out of bounds (items length: ${formTemplate.items.length})`);
        return; // Exit early to prevent errors
      }
      
      // Create a copy of the items array
      const items = Array.from(formTemplate.items);
      
      // Get the item at the source index
      const sourceItem = items[source.index];
      if (!sourceItem) {
        console.error(`ERROR: No item found at source index ${source.index}`);
        return; // Exit early to prevent errors
      }
      
      // Check if the draggableId exists in our items
      // Make sure to convert all IDs to strings for comparison
      let itemToMove = null;
      let itemIndex = -1;
      
      // First try to find the item by draggableId
      for (let i = 0; i < items.length; i++) {
        if (items[i].id && String(items[i].id) === String(draggableId)) {
          itemToMove = items[i];
          itemIndex = i;
          break;
        }
      }
      
      // If we couldn't find the item by draggableId, use the source index as a fallback
      if (!itemToMove) {
        console.error(`ERROR: Cannot find draggable with id: ${draggableId} in form items!`);
        console.log('Available IDs:', items.map(item => String(item.id)));
        console.log('Attempting to recover using item at source index', source.index);
        
        // Use the item at the source index as a fallback
        itemToMove = sourceItem;
        itemIndex = source.index;
        
        // Update the item's id to match the draggableId to prevent future issues
        // Only do this if the draggableId is not a preview item
        if (itemToMove && draggableId && !draggableId.startsWith('preview_')) {
          console.log(`Updating item id from ${itemToMove.id} to ${draggableId} to match draggableId`);
          itemToMove.id = String(draggableId);
        }
      }
      
      // If we still don't have an item to move, exit
      if (!itemToMove) {
        console.error('Cannot recover, exiting drag operation');
        return; // Exit early to prevent errors
      }
      
      // Ensure the item has a valid ID
      if (!itemToMove.id) {
        itemToMove.id = generateUniqueId();
        console.log(`Generated new ID ${itemToMove.id} for item with missing ID`);
      } else if (typeof itemToMove.id !== 'string') {
        itemToMove.id = String(itemToMove.id);
        console.log(`Converted ID ${itemToMove.id} to string`);
      }
      
      // Additional logging to help diagnose issues
      console.log('Item to move:', { 
        id: itemToMove.id, 
        _id: itemToMove._id, 
        type: itemToMove.type, 
        text: itemToMove.questionText?.substring(0, 20) 
      });
      
      // Log all current items with their IDs for debugging
      console.log('Current items before reordering:');
      items.forEach((item, index) => {
        console.log(`Item ${index}:`, { id: item.id, _id: item._id, type: item.type, text: item.questionText });
      });
      
      // Remove the item from its original position
      items.splice(itemIndex, 1);
      
      // Log the removed item
      console.log('Moved item:', { id: itemToMove.id, _id: itemToMove._id, type: itemToMove.type });
      
      // Insert the item at its new position
      items.splice(destination.index, 0, itemToMove);

      // Log all items after reordering
      console.log('Items after reordering:');
      items.forEach((item, index) => {
        console.log(`Item ${index}:`, { id: item.id, _id: item._id, type: item.type });
      });

      // Update the form template with the new order of items
      setFormTemplate(prev => ({
        ...prev,
        items
      }));
      
      console.log('Form template updated with reordered items');

      // Update the current item index if it was affected by the reordering
      if (currentItemIndex === source.index) {
        setCurrentItemIndex(destination.index);
      } else if (
        currentItemIndex !== null &&
        ((source.index < currentItemIndex && destination.index >= currentItemIndex) ||
         (source.index > currentItemIndex && destination.index <= currentItemIndex))
      ) {
        // Adjust the current item index if the dragged item moved past it
        const offset = source.index < currentItemIndex ? 1 : -1;
        setCurrentItemIndex(currentItemIndex + offset);
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error);
      // Don't rethrow the error to prevent the component from crashing
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
      // Process form items to remove client-side id field and ensure all values are of correct type
      const processedTemplate = {
        ...formTemplate,
        items: formTemplate.items.map(item => {
          // Create a new object with processed values
          const processedItem = { ...item };
          
          // Remove the client-side id field to prevent conflicts with MongoDB's _id
          if (processedItem.id) {
            delete processedItem.id;
          }
          
          // Ensure all string fields are actually strings
          if (processedItem.questionText !== undefined && typeof processedItem.questionText !== 'string') {
            processedItem.questionText = String(processedItem.questionText);
          }
          
          if (processedItem.placeholder !== undefined && typeof processedItem.placeholder !== 'string') {
            processedItem.placeholder = String(processedItem.placeholder);
          }
          
          if (processedItem.instructions !== undefined && typeof processedItem.instructions !== 'string') {
            processedItem.instructions = String(processedItem.instructions);
          }
          
          // Handle nested objects like matrix
          if (processedItem.matrix) {
            if (processedItem.matrix.rowHeader !== undefined && typeof processedItem.matrix.rowHeader !== 'string') {
              processedItem.matrix.rowHeader = String(processedItem.matrix.rowHeader);
            }
          }
          
          return processedItem;
        })
      };
      
      let response;
      
      if (isEditMode) {
        response = await axios.put(`/api/form-templates/${id}`, processedTemplate);
        toast.success('Form template updated successfully');
      } else {
        response = await axios.post('/api/form-templates', processedTemplate);
        toast.success('Form template created successfully');
      }
      
      // Navigate to form templates list
      navigate('/forms/templates');
    } catch (error) {
      console.error('Error saving form template:', error);
      toast.error(`Failed to save form template: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // State to track the type of question being previewed without adding to the list
  const [previewQuestionType, setPreviewQuestionType] = useState<string | null>(null);
  
  // State to track the current preview item that's being edited
  const [currentPreviewItem, setCurrentPreviewItem] = useState<FormItem | null>(null);

  // Function to handle selecting an item
  const handleSelectItem = (index: number, questionType?: string) => {
    if (index === -1 && questionType) {
      // Special case: just display the form without adding to list
      // We'll handle this in renderQuestionEditor
      setCurrentItemIndex(null);
      setPreviewQuestionType(questionType);
      setCurrentPreviewItem(null); // Reset the current preview item
    } else {
      setCurrentItemIndex(index);
      setPreviewQuestionType(null);
      setCurrentPreviewItem(null); // Reset the current preview item
    }
  };
  
  // Function to add the current preview item to the form
  const addPreviewItemToForm = () => {
    if (currentPreviewItem) {
      const updatedItems = [...formTemplate.items, currentPreviewItem];
      setFormTemplate(prev => ({
        ...prev,
        items: updatedItems
      }));
      
      // Select the newly added item
      setCurrentItemIndex(updatedItems.length - 1);
      setPreviewQuestionType(null);
      setCurrentPreviewItem(null);
      
      toast.success('Question added to form');
    }
  };

  const renderQuestionEditor = () => {
    // If we have a preview question type, render that editor without adding to the list
    if (previewQuestionType) {
      // Initialize the preview item if currentPreviewItem is null
      if (!currentPreviewItem) {
        const initialPreviewItem = {
          id: generateUniqueId(),
          type: previewQuestionType,
          questionText: 'Type your question text here',
          isRequired: false,
          placeholder: 'Enter your answer here',
          multipleLines: false
        };
        setCurrentPreviewItem(initialPreviewItem);
      }
      
      // Use the current preview item or a default one
      const previewItem = currentPreviewItem || {
        id: generateUniqueId(),
        type: previewQuestionType,
        questionText: 'Type your question text here',
        isRequired: false,
        placeholder: 'Enter your answer here',
        multipleLines: false
      };

      // Render the appropriate editor based on the preview type
      switch (previewQuestionType) {
        case 'openAnswer':
          return (
            <div className="flex flex-col">
              <OpenAnswerQuestionEditor
                item={previewItem}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'mixedControls':
          return (
            <div className="flex flex-col">
              <MixedControlsQuestionEditor
                item={previewItem}
                onChange={(updatedItem) => {
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'multipleChoiceSingle':
          return (
            <div className="flex flex-col">
              <MultipleChoiceSingleQuestionEditor
                item={{
                  ...previewItem,
                  type: 'multipleChoiceSingle',
                  options: ['Option 1', 'Option 2', 'Option 3']
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'multipleChoiceMultiple':
          return (
            <div className="flex flex-col">
              <MultipleChoiceMultipleQuestionEditor
                item={{
                  ...previewItem,
                  type: 'multipleChoiceMultiple',
                  options: ['Option 1', 'Option 2', 'Option 3']
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'matrix':
          return (
            <div className="flex flex-col">
              <MatrixQuestionEditor
                item={{
                  ...previewItem,
                  type: 'matrix',
                  matrix: {
                    rowHeader: 'Questions',
                    columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
                    columnTypes: ['checkbox', 'checkbox', 'checkbox'],
                    rows: ['Row 1', 'Row 2', 'Row 3'],
                    dropdownOptions: [[], [], []],
                    displayTextBox: false,
                    allowMultipleAnswers: true
                  }
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'matrixSingleAnswer':
          return (
            <div className="flex flex-col">
              <MatrixSingleAnswerQuestionEditor
                item={{
                  ...previewItem,
                  type: 'matrixSingleAnswer',
                  matrix: {
                    rowHeader: 'Questions',
                    columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
                    columnTypes: ['radio', 'radio', 'radio'],
                    rows: ['Row 1', 'Row 2', 'Row 3'],
                    dropdownOptions: [[], [], []],
                    displayTextBox: false,
                    allowMultipleAnswers: false
                  }
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'sectionTitle':
          return (
            <div className="flex flex-col">
              <SectionTitleQuestionEditor
                item={{
                  ...previewItem,
                  type: 'sectionTitle',
                  sectionContent: 'Add additional information or instructions here.'
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'fileAttachment':
          return (
            <div className="flex flex-col">
              <FileAttachmentQuestionEditor
                item={{
                  ...previewItem,
                  type: 'fileAttachment',
                  fileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx'],
                  maxFileSize: 5 * 1024 * 1024 // 5MB
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'eSignature':
          return (
            <div className="flex flex-col">
              <ESignatureQuestionEditor
                item={{
                  ...previewItem,
                  type: 'eSignature',
                  signaturePrompt: 'Please sign below to confirm your agreement.'
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'smartEditor':
          return (
            <div className="flex flex-col">
              <SmartEditorQuestionEditor
                item={{
                  ...previewItem,
                  type: 'smartEditor',
                  editorContent: '<p>Enter your formatted text here.</p>'
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        case 'bodyMap':
          return (
            <div className="flex flex-col">
              <BodyMapQuestionEditor
                item={{
                  ...previewItem,
                  type: 'bodyMap',
                  bodyMapType: 'fullBody',
                  allowPatientMarkings: true
                }}
                onChange={(updatedItem) => {
                  // Update the current preview item
                  setCurrentPreviewItem(updatedItem);
                  console.log('Preview item updated:', updatedItem);
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
        default:
          return (
            <div className="flex flex-col">
              <div className="flex items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">Preview not available for this question type</p>
                  <p className="text-sm text-gray-400">Click the plus icon to add this question to your form</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  onClick={addPreviewItemToForm}
                >
                  Add to Form
                </button>
              </div>
            </div>
          );
      }
    }

    if (currentItemIndex === null || !formTemplate.items[currentItemIndex]) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No question selected</p>
            <QuestionButton
              icon={AlignLeft}
              label="Add Open Answer Question"
              onClick={() => addNewQuestion('openAnswer')}
              color="#10B981"
              bgColor="bg-green-50"
              hoverColor="hover:bg-green-100"
              textColor="text-green-700"
              size="lg"
              variant="solid"
            />
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
      case 'openAnswer':
        return (
          <OpenAnswerQuestionEditor
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
      case 'mixedControls':
        return (
          <MixedControlsQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'multipleChoiceSingle':
        return (
          <MultipleChoiceSingleQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'multipleChoiceMultiple':
        return (
          <MultipleChoiceMultipleQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'matrix':
        return (
          <MatrixQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'matrixSingleAnswer':
        return (
          <MatrixSingleAnswerQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'sectionTitle':
        return (
          <SectionTitleQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'fileAttachment':
        return (
          <FileAttachmentQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'eSignature':
        return (
          <ESignatureQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'smartEditor':
        return (
          <SmartEditorQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      case 'bodyMap':
        return (
          <BodyMapQuestionEditor
            item={currentItem}
            onChange={(updatedItem) => updateQuestion(currentItemIndex, updatedItem)}
          />
        );
      default:
        return <div>Unknown question type: {currentItem.type}</div>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Ensure all items have string IDs before rendering
  // This useEffect is merged with the one above to prevent hooks inconsistency
  // The dependency array is set to match the other useEffect to ensure consistent hook calls
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/forms/templates')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
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
                <div className="animate-spin mr-2 h-4 w-4"></div>
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
              onSelectItem={handleSelectItem}
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
    </DragDropContext>
  );
};

export default FormBuilder;