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
  id?: string;
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
  
  useEffect(() => {
    if (isEditMode) {
      fetchFormTemplate();
    }
  }, [id]);
  
  useEffect(() => {
    if (!formTemplate.items || formTemplate.items.length === 0) return;
    
    console.log('Validating item IDs:', formTemplate.items);
    
    const usedIds = new Set();
    let hasChanges = false;
    
    const updatedItems = formTemplate.items.map((item, index) => {
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
        const newId = generateUniqueId();
        console.log(`Missing ID - Assigning new ID ${newId} to item at index ${index}:`, item);
        usedIds.add(newId);
        hasChanges = true;
        return { ...item, id: newId };
      } else if (typeof item.id !== 'string') {
        const stringId = String(item.id);
        console.log(`Non-string ID - Converting ID ${item.id} to string for item at index ${index}:`, item);
        
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
        const newId = generateUniqueId();
        console.log(`Duplicate ID - Assigning new ID ${newId} to item at index ${index}:`, item);
        usedIds.add(newId);
        hasChanges = true;
        return { ...item, id: newId };
      }
      
      usedIds.add(item.id);
      return item;
    });
    
    if (hasChanges) {
      console.log('Updating items with valid string IDs:', updatedItems);
      setFormTemplate(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  }, [formTemplate.items]);
  
  const fetchFormTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/form-templates/${id}`);
      
      console.log('Original items from API:', response.data.items);
      
      const usedIds = new Set();
      
      const itemsWithIds = response.data.items.map((item: any, index: number) => {
        const safeId = item.id || generateUniqueId();
        if (!item.id || usedIds.has(item.id)) {
          const newId = generateUniqueId();
          console.log(`${!item.id ? 'Missing ID' : 'Duplicate ID'} - Assigning new ID ${newId} to item at index ${index}:`, item);
          
          usedIds.add(newId);
          
          return {
            ...item,
            id: newId
          };
        }
        
        usedIds.add(safeId);
        console.log(`Item at index ${index} already has ID ${item.id}:`, item);
        return {
          ...item,
          id: safeId
        };
      });
      
      const allItemsHaveIds = itemsWithIds.every((item: any, index: number) => {
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
      
      if (response.data.items.length > 0) {
        setCurrentItemIndex(0);
      }
    } catch (error: any) {
      console.error('Error fetching form template:', error);
      toast.error('Failed to load form template');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
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
  
  const generateUniqueId = () => {
    const uniqueId = 'q_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log('Generated new unique ID:', uniqueId);
    return uniqueId;
  };
  
  const createNewQuestion = (questionType: string): FormItem => {
    const uniqueId = generateUniqueId();
    let newItem: FormItem;
    
    switch (questionType) {
      case 'blank':
      case 'openAnswer':
        newItem = {
          id: uniqueId,
          type: 'openAnswer',
          questionText: '[EN] Type your question text here',
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
            { fieldName: 'Street Address', fieldType: 'text', required: true },
            { fieldName: 'Apt/Unit #', fieldType: 'text', required: false },
            { fieldName: 'City', fieldType: 'text', required: true },
            { fieldName: 'State', fieldType: 'text', required: true },
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
              [],
              ['Food', 'Medication', 'Environmental', 'Other'],
              ['Rash', 'Hives', 'Swelling', 'Anaphylaxis', 'GI Issues', 'Respiratory', 'Other'],
              ['Mild', 'Moderate', 'Severe', 'Life-threatening'],
              [],
              []
            ],
            displayTextBox: true
          }
        };
        break;
      case 'mixedControls':
        newItem = {
          id: uniqueId,
          type: 'mixedControls',
          questionText: '[EN] Mixed Controls Question',
          isRequired: false,
          instructions: 'Please fill out all fields below.',
          mixedControlsConfig: [
            { controlType: 'text', label: 'Text Field', required: false, placeholder: 'Enter text here' },
            { controlType: 'dropdown', label: 'Dropdown Field', required: false, options: ['Option 1', 'Option 2', 'Option 3'] }
          ]
        };
        break;
      case 'multipleChoiceSingle':
        newItem = {
          id: uniqueId,
          type: 'multipleChoiceSingle',
          questionText: '[EN] Multiple Choice Question',
          isRequired: false,
          options: ['Option 1', 'Option 2', 'Option 3']
        };
        break;
      case 'multipleChoiceMultiple':
        newItem = {
          id: uniqueId,
          type: 'multipleChoiceMultiple',
          questionText: '[EN] Multiple Choice Question (Select Multiple)',
          isRequired: false,
          options: ['Option 1', 'Option 2', 'Option 3']
        };
        break;
      case 'matrix':
        newItem = {
          id: uniqueId,
          type: 'matrix',
          questionText: '[EN] Matrix Question.',
          isRequired: false,
          matrix: {
            rowHeader: 'Questions',
            columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
            columnTypes: ['text', 'text', 'text'],
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
          questionText: '[EN] Matrix Question (Single Answer per Row)',
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
          questionText: '[EN] Section Title',
          isRequired: false,
          sectionContent: 'Add additional information or instructions here.'
        };
        break;
      case 'fileAttachment':
        newItem = {
          id: uniqueId,
          type: 'fileAttachment',
          questionText: '[EN] File Attachment',
          isRequired: false,
          fileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx'],
          maxFileSize: 5 * 1024 * 1024
        };
        break;
      case 'eSignature':
        newItem = {
          id: uniqueId,
          type: 'eSignature',
          questionText: '[EN] Signature',
          isRequired: false,
          signaturePrompt: 'Please sign below to confirm your agreement.'
        };
        break;
      case 'smartEditor':
        newItem = {
          id: uniqueId,
          type: 'smartEditor',
          questionText: '[EN] Smart Editor',
          isRequired: false,
          editorContent: '<p>Enter your content here...</p>'
        };
        break;
      case 'bodyMap':
        newItem = {
          id: uniqueId,
          type: 'bodyMap',
          questionText: '[EN] Body Map / Drawing',
          isRequired: false,
          bodyMapType: 'fullBody',
          allowPatientMarkings: true
        };
        break;
      default:
        newItem = {
          id: uniqueId,
          type: questionType,
          questionText: '[EN] Type your question text here',
          isRequired: false
        };
    }
    
    return newItem;
  };

  const addNewQuestion = (questionType: string) => {
    const newItem = createNewQuestion(questionType);
    const updatedItems = [...formTemplate.items, newItem];
    setFormTemplate(prev => ({
      ...prev,
      items: updatedItems
    }));
    
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
    if (itemToDuplicate._id) delete itemToDuplicate._id;
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
    
    setCurrentItemIndex(index + 1);
  };
  
  const deleteQuestion = (index: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedItems = formTemplate.items.filter((_, i) => i !== index);
      
      setFormTemplate(prev => ({
        ...prev,
        items: updatedItems
      }));
      
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

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    console.log('Drag end event:', result);
    console.log('Draggable ID:', draggableId);
    console.log('Source index:', source.index, 'Destination index:', destination?.index);
    console.log('Source droppableId:', source.droppableId, 'Destination droppableId:', destination?.droppableId);
    
    if (!destination) {
      console.log('No destination, no changes made');
      return;
    }
    
    try {
      if (draggableId.startsWith('preview_')) {
        console.log('Handling preview item drag with ID:', draggableId);
        const questionType = draggableId.replace('preview_', '');
        if (questionType) {
          const newItem = createNewQuestion(questionType);
          const updatedItems = [...formTemplate.items];
          
          if (destination.droppableId === 'question-list') {
            updatedItems.splice(destination.index, 0, newItem);
            setFormTemplate(prev => ({
              ...prev,
              items: updatedItems
            }));
            
            setCurrentItemIndex(destination.index);
          } else {
            addNewQuestion(questionType);
          }
          return;
        }
      }
      
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        console.log('Same position, no changes made');
        return;
      }
      
      if (source.index >= formTemplate.items.length) {
        console.error(`ERROR: Source index ${source.index} is out of bounds (items length: ${formTemplate.items.length})`);
        return;
      }
      
      const items = Array.from(formTemplate.items);
      
      const sourceItem = items[source.index];
      if (!sourceItem) {
        console.error(`ERROR: No item found at source index ${source.index}`);
        return;
      }
      
      let itemToMove = null;
      let itemIndex = -1;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].id && String(items[i].id) === String(draggableId)) {
          itemToMove = items[i];
          itemIndex = i;
          break;
        }
      }
      
      if (!itemToMove) {
        console.error(`ERROR: Cannot find draggable with id: ${draggableId} in form items!`);
        console.log('Available IDs:', items.map(item => String(item.id)));
        console.log('Attempting to recover using item at source index', source.index);
        
        itemToMove = sourceItem;
        itemIndex = source.index;
        
        if (itemToMove && draggableId && !draggableId.startsWith('preview_')) {
          console.log(`Updating item id from ${itemToMove.id} to ${draggableId} to match draggableId`);
          itemToMove.id = String(draggableId);
        }
      }
      
      if (!itemToMove) {
        console.error('Cannot recover, exiting drag operation');
        return;
      }
      
      if (!itemToMove.id) {
        itemToMove.id = generateUniqueId();
        console.log(`Generated new ID ${itemToMove.id} for item with missing ID`);
      } else if (typeof itemToMove.id !== 'string') {
        itemToMove.id = String(itemToMove.id);
        console.log(`Converted ID ${itemToMove.id} to string`);
      }
      
      console.log('Item to move:', { 
        id: itemToMove.id, 
        _id: itemToMove._id, 
        type: itemToMove.type, 
        text: itemToMove.questionText?.substring(0, 20) 
      });
      
      console.log('Current items before reordering:');
      items.forEach((item, index) => {
        console.log(`Item ${index}:`, { id: item.id, _id: item._id, type: item.type, text: item.questionText });
      });
      
      items.splice(itemIndex, 1);
      
      console.log('Moved item:', { id: itemToMove.id, _id: itemToMove._id, type: itemToMove.type });
      
      items.splice(destination.index, 0, itemToMove);

      console.log('Items after reordering:');
      items.forEach((item, index) => {
        console.log(`Item ${index}:`, { id: item.id, _id: item._id, type: item.type });
      });

      setFormTemplate(prev => ({
        ...prev,
        items
      }));
      
      console.log('Form template updated with reordered items');

      if (currentItemIndex === source.index) {
        setCurrentItemIndex(destination.index);
      } else if (
        currentItemIndex !== null &&
        ((source.index < currentItemIndex && destination.index >= currentItemIndex) ||
         (source.index > currentItemIndex && destination.index <= currentItemIndex))
      ) {
        const offset = source.index < currentItemIndex ? 1 : -1;
        setCurrentItemIndex(currentItemIndex + offset);
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error);
    }
  };
  
  const isDefaultMatrix = (item: FormItem) => {
    // Only filter out matrix questions that are completely unchanged from the default
    const defaultMatrixConfig = {
      rowHeader: 'Questions',
      columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
      rows: ['Row 1', 'Row 2', 'Row 3'],
      dropdownOptions: [[], [], []],
      displayTextBox: false
    };

    return (
      item.type === 'matrix' &&
      item.questionText === '[EN] Matrix Question' &&
      item.matrix &&
      item.matrix.rowHeader === defaultMatrixConfig.rowHeader &&
      item.matrix.columnHeaders.join(',') === defaultMatrixConfig.columnHeaders.join(',') &&
      item.matrix.rows.join(',') === defaultMatrixConfig.rows.join(',') &&
      item.matrix.dropdownOptions.every((opts, i) => opts.length === defaultMatrixConfig.dropdownOptions[i].length) &&
      item.matrix.displayTextBox === defaultMatrixConfig.displayTextBox &&
      item.matrix.columnTypes.join(',') === 'checkbox,checkbox,checkbox' &&
      item.matrix.allowMultipleAnswers === true
    ) || (
      item.type === 'matrixSingleAnswer' &&
      item.questionText === '[EN] Matrix Question (Single Answer per Row)' &&
      item.matrix &&
      item.matrix.rowHeader === defaultMatrixConfig.rowHeader &&
      item.matrix.columnHeaders.join(',') === defaultMatrixConfig.columnHeaders.join(',') &&
      item.matrix.rows.join(',') === defaultMatrixConfig.rows.join(',') &&
      item.matrix.dropdownOptions.every((opts, i) => opts.length === defaultMatrixConfig.dropdownOptions[i].length) &&
      item.matrix.displayTextBox === defaultMatrixConfig.displayTextBox &&
      item.matrix.columnTypes.join(',') === 'radio,radio,radio' &&
      item.matrix.allowMultipleAnswers === false
    );
  };

  const isDefaultSectionTitle = (item: FormItem) => {
    // Only filter out section title questions that are completely unchanged
    return (
      item.type === 'sectionTitle' &&
      item.questionText === '[EN] Section Title' &&
      item.sectionContent === 'Add additional information or instructions here.'
    );
  };

  const saveFormTemplate = async () => {
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
      // Only filter out completely unchanged default matrix and section title questions
      const filteredItems = formTemplate.items.filter(
        item => !isDefaultMatrix(item) && !isDefaultSectionTitle(item)
      );

      const processedTemplate = {
        ...formTemplate,
        items: filteredItems.map(item => {
          const processedItem = { ...item };
          if (processedItem.id) delete processedItem.id;
          if (processedItem.questionText !== undefined && typeof processedItem.questionText !== 'string') {
            processedItem.questionText = String(processedItem.questionText);
          }
          
          if (processedItem.placeholder !== undefined && typeof processedItem.placeholder !== 'string') {
            processedItem.placeholder = String(processedItem.placeholder);
          }
          
          if (processedItem.instructions !== undefined && typeof processedItem.instructions !== 'string') {
            processedItem.instructions = String(processedItem.instructions);
          }
          
          if (processedItem.matrix) {
            if (processedItem.matrix.rowHeader !== undefined && typeof processedItem.matrix.rowHeader !== 'string') {
              processedItem.matrix.rowHeader = String(processedItem.matrix.rowHeader);
            }
          }
          
          // Ensure matrix fields are properly initialized
          if (processedItem.type === 'matrix' || processedItem.type === 'matrixSingleAnswer') {
            processedItem.matrix = {
              ...processedItem.matrix,
              columnHeaders: processedItem.matrix?.columnHeaders || [],
              columnTypes: processedItem.matrix?.columnTypes || [],
              rows: processedItem.matrix?.rows || [],
              dropdownOptions: processedItem.matrix?.dropdownOptions || [],
              displayTextBox: processedItem.matrix?.displayTextBox || false,
              allowMultipleAnswers: processedItem.matrix?.allowMultipleAnswers ?? (processedItem.type === 'matrix' ? true : false)
            };
          }
          
          // Ensure sectionContent is included for sectionTitle
          if (processedItem.type === 'sectionTitle' && processedItem.sectionContent === undefined) {
            processedItem.sectionContent = '';
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

      navigate('/forms/templates');
    } catch (error: any) {
      console.error('Error saving form template:', error);
      toast.error(`Failed to save form template: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const [previewQuestionType, setPreviewQuestionType] = useState<string | null>(null);
  const [currentPreviewItem, setCurrentPreviewItem] = useState<FormItem | null>(null);

  const handleSelectItem = (index: number, questionType?: string) => {
    if (index === -1 && questionType) {
      setCurrentItemIndex(null);
      setPreviewQuestionType(questionType);
      setCurrentPreviewItem(null);
    } else {
      setCurrentItemIndex(index);
      setPreviewQuestionType(null);
      setCurrentPreviewItem(null);
    }
  };
  
  const addPreviewItemToForm = () => {
    if (currentPreviewItem) {
      const updatedItems = [...formTemplate.items, currentPreviewItem];
      setFormTemplate(prev => ({
        ...prev,
        items: updatedItems
      }));
      
      setCurrentItemIndex(updatedItems.length - 1);
      setPreviewQuestionType(null);
      setCurrentPreviewItem(null);
      
      toast.success('Question added to form');
    }
  };

  const getQuestionLanguage = (questionText: string) => {
    if (questionText.startsWith('[EN]')) return 'english';
    if (questionText.startsWith('[ES]')) return 'spanish';
    return 'english';
  };

  const setQuestionLanguagePrefix = (questionText: string, lang: 'english' | 'spanish') => {
    let text = questionText.replace(/^\[(EN|ES)\]\s*/, '');
    return (lang === 'english' ? '[EN] ' : '[ES] ') + text;
  };

  const renderQuestionEditor = () => {
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
    const renderWithLanguageDropdown = (EditorComponent: React.ComponentType<any>) => (
      <div className="flex flex-col">
        <div className="flex justify-end mb-2">
          <select
            value={getQuestionLanguage(currentItem.questionText)}
            onChange={e => {
              const lang = e.target.value as 'english' | 'spanish';
              updateQuestion(currentItemIndex, {
                ...currentItem,
                questionText: setQuestionLanguagePrefix(currentItem.questionText, lang)
              });
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
          </select>
        </div>
        <EditorComponent
          item={currentItem}
          onChange={(updatedItem: any) => updateQuestion(currentItemIndex, {
            ...updatedItem,
            questionText: setQuestionLanguagePrefix(updatedItem.questionText, getQuestionLanguage(updatedItem.questionText))
          })}
        />
      </div>
    );

    switch (currentItem.type) {
      case 'blank':
        return renderWithLanguageDropdown(BlankQuestionEditor);
      case 'openAnswer':
        return renderWithLanguageDropdown(OpenAnswerQuestionEditor);
      case 'mixedControls':
        return renderWithLanguageDropdown(MixedControlsQuestionEditor);
      case 'multipleChoiceSingle':
        return renderWithLanguageDropdown(MultipleChoiceSingleQuestionEditor);
      case 'multipleChoiceMultiple':
        return renderWithLanguageDropdown(MultipleChoiceMultipleQuestionEditor);
      case 'matrix':
        return renderWithLanguageDropdown(MatrixQuestionEditor);
      case 'matrixSingleAnswer':
        return renderWithLanguageDropdown(MatrixSingleAnswerQuestionEditor);
      case 'sectionTitle':
        return renderWithLanguageDropdown(SectionTitleQuestionEditor);
      case 'fileAttachment':
        return renderWithLanguageDropdown(FileAttachmentQuestionEditor);
      case 'eSignature':
        return renderWithLanguageDropdown(ESignatureQuestionEditor);
      case 'smartEditor':
        return renderWithLanguageDropdown(SmartEditorQuestionEditor);
      case 'bodyMap':
        return renderWithLanguageDropdown(BodyMapQuestionEditor);
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
        return <div>Unknown question type: {currentItem.type}</div>;
    }
  };
  
  useEffect(() => {
    if (!id && formTemplate.items.length === 0) {
      const demographicsQuestion = createNewQuestion('demographics');
      setFormTemplate(prev => ({
        ...prev,
        items: [demographicsQuestion]
      }));
      setCurrentItemIndex(0);
    }
  }, []);
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <QuestionSidebar
              items={formTemplate.items.map(item => ({ ...item, id: item.id || generateUniqueId() }))}
              currentItemIndex={currentItemIndex}
              onSelectItem={handleSelectItem}
              onAddItem={addNewQuestion}
              onDuplicateItem={duplicateQuestion}
              onDeleteItem={deleteQuestion}
            />
          </div>
          
          <div className="md:col-span-3">
            {renderQuestionEditor()}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default FormBuilder;