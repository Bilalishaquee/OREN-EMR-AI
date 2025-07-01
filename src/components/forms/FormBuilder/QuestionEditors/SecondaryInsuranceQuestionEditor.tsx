import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';

interface InsuranceField {
  fieldName: string;
  fieldType: string;
  required: boolean;
  options?: string[];
}

interface SecondaryInsuranceQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    instructions?: string;
    insuranceFields?: InsuranceField[];
  };
  onChange: (updatedItem: any) => void;
}

const SecondaryInsuranceQuestionEditor: React.FC<SecondaryInsuranceQuestionProps> = ({ item, onChange }) => {
  const [showFieldOptions, setShowFieldOptions] = useState<number | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onChange({
        ...item,
        [name]: checked
      });
    } else {
      onChange({
        ...item,
        [name]: value
      });
    }
  };
  
  const handleFieldChange = (index: number, field: string, value: any) => {
    if (!item.insuranceFields) return;
    
    const updatedFields = [...item.insuranceFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value
    };
    
    onChange({
      ...item,
      insuranceFields: updatedFields
    });
  };
  
  const addField = () => {
    const newField = {
      fieldName: 'New Field',
      fieldType: 'text',
      required: false
    };
    
    onChange({
      ...item,
      insuranceFields: [...(item.insuranceFields || []), newField]
    });
  };
  
  const removeField = (index: number) => {
    if (!item.insuranceFields) return;
    
    const updatedFields = item.insuranceFields.filter((_, i) => i !== index);
    
    onChange({
      ...item,
      insuranceFields: updatedFields
    });
  };
  
  const addOption = (fieldIndex: number, option: string) => {
    if (!item.insuranceFields) return;
    
    const updatedFields = [...item.insuranceFields];
    const field = updatedFields[fieldIndex];
    
    if (!field.options) {
      field.options = [];
    }
    
    field.options.push(option);
    
    onChange({
      ...item,
      insuranceFields: updatedFields
    });
  };
  
  const removeOption = (fieldIndex: number, optionIndex: number) => {
    if (!item.insuranceFields || !item.insuranceFields[fieldIndex].options) return;
    
    const updatedFields = [...item.insuranceFields];
    updatedFields[fieldIndex].options = updatedFields[fieldIndex].options?.filter((_, i) => i !== optionIndex);
    
    onChange({
      ...item,
      insuranceFields: updatedFields
    });
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Question Type</h2>
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Question Options
            </button>
          </div>
        </div>
        
        <div className="relative">
          <select
            value="mixed"
            disabled
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="mixed">Mixed Controls</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
          Block Instructions (optional)
        </label>
        <textarea
          id="instructions"
          name="instructions"
          value={item.instructions || ''}
          onChange={handleChange}
          rows={3}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Secondary Insurance"
        />
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
            help
          </a>
        </div>
        
        <div className="space-y-4">
          {item.insuranceFields?.map((field, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={field.fieldName}
                    onChange={(e) => handleFieldChange(index, 'fieldName', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type
                  </label>
                  <select
                    value={field.fieldType}
                    onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`required-${index}`}
                    checked={field.required}
                    onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-900">
                    Required
                  </label>
                </div>
              </div>
              
              {/* Options for dropdown fields */}
              {field.fieldType === 'dropdown' && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Options
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFieldOptions(showFieldOptions === index ? null : index)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showFieldOptions === index ? 'Hide Options' : 'Show Options'}
                    </button>
                  </div>
                  
                  {showFieldOptions === index && (
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <div className="mb-2">
                        <div className="flex">
                          <input
                            type="text"
                            id={`new-option-${index}`}
                            placeholder="Add new option"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                addOption(index, (e.target as HTMLInputElement).value.trim());
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById(`new-option-${index}`) as HTMLInputElement;
                              if (input.value.trim()) {
                                addOption(index, input.value.trim());
                                input.value = '';
                              }
                            }}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 shadow-sm text-sm font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      
                      <ul className="space-y-1 max-h-40 overflow-y-auto">
                        {field.options?.map((option, optionIndex) => (
                          <li key={optionIndex} className="flex justify-between items-center py-1 px-2 hover:bg-gray-100 rounded">
                            <span>{option}</span>
                            <button
                              type="button"
                              onClick={() => removeOption(index, optionIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Delete button */}
              <button
                type="button"
                onClick={() => removeField(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Duplicate
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default SecondaryInsuranceQuestionEditor;