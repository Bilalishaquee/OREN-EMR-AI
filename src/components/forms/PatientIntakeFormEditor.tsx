import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

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

interface PatientIntakeFormEditorProps {
  item: FormItem;
  onChange: (updatedItem: FormItem) => void;
}

const PatientIntakeFormEditor: React.FC<PatientIntakeFormEditorProps> = ({ item, onChange }) => {
  const [showFieldOptions, setShowFieldOptions] = useState<number | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
  
  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...item,
      instructions: e.target.value
    });
  };
  
  const handleDemographicFieldChange = (index: number, field: string, value: any) => {
    if (!item.demographicFields) return;
    
    const updatedFields = [...item.demographicFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value
    };
    
    onChange({
      ...item,
      demographicFields: updatedFields
    });
  };
  
  const handleInsuranceFieldChange = (index: number, field: string, value: any) => {
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
  
  const handleMatrixChange = (field: string, value: any) => {
    if (!item.matrix) return;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        [field]: value
      }
    });
  };
  
  const handleColumnHeaderChange = (index: number, value: string) => {
    if (!item.matrix) return;
    
    const updatedHeaders = [...item.matrix.columnHeaders];
    updatedHeaders[index] = value;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        columnHeaders: updatedHeaders
      }
    });
  };
  
  const handleColumnTypeChange = (index: number, value: string) => {
    if (!item.matrix) return;
    
    const updatedTypes = [...item.matrix.columnTypes];
    updatedTypes[index] = value;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        columnTypes: updatedTypes
      }
    });
  };
  
  const addDemographicField = () => {
    if (!item.demographicFields) return;
    
    onChange({
      ...item,
      demographicFields: [
        ...item.demographicFields,
        { fieldName: 'New Field', fieldType: 'text', required: false }
      ]
    });
  };
  
  const removeDemographicField = (index: number) => {
    if (!item.demographicFields) return;
    
    onChange({
      ...item,
      demographicFields: item.demographicFields.filter((_, i) => i !== index)
    });
  };
  
  const addInsuranceField = () => {
    if (!item.insuranceFields) return;
    
    onChange({
      ...item,
      insuranceFields: [
        ...item.insuranceFields,
        { fieldName: 'New Field', fieldType: 'text', required: false }
      ]
    });
  };
  
  const removeInsuranceField = (index: number) => {
    if (!item.insuranceFields) return;
    
    onChange({
      ...item,
      insuranceFields: item.insuranceFields.filter((_, i) => i !== index)
    });
  };
  
  const addMatrixColumn = () => {
    if (!item.matrix) return;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        columnHeaders: [...item.matrix.columnHeaders, 'New Column'],
        columnTypes: [...item.matrix.columnTypes, 'text'],
        dropdownOptions: [...item.matrix.dropdownOptions, []]
      }
    });
  };
  
  const removeMatrixColumn = (index: number) => {
    if (!item.matrix) return;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        columnHeaders: item.matrix.columnHeaders.filter((_, i) => i !== index),
        columnTypes: item.matrix.columnTypes.filter((_, i) => i !== index),
        dropdownOptions: item.matrix.dropdownOptions.filter((_, i) => i !== index)
      }
    });
  };
  
  const addMatrixRow = () => {
    if (!item.matrix) return;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        rows: [...item.matrix.rows, (item.matrix.rows.length + 1).toString()]
      }
    });
  };
  
  const removeMatrixRow = (index: number) => {
    if (!item.matrix) return;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        rows: item.matrix.rows.filter((_, i) => i !== index)
      }
    });
  };
  
  const addDropdownOption = (columnIndex: number, option: string) => {
    if (!item.matrix) return;
    
    const updatedOptions = [...item.matrix.dropdownOptions];
    if (!updatedOptions[columnIndex]) {
      updatedOptions[columnIndex] = [];
    }
    
    updatedOptions[columnIndex].push(option);
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        dropdownOptions: updatedOptions
      }
    });
  };
  
  const removeDropdownOption = (columnIndex: number, optionIndex: number) => {
    if (!item.matrix || !item.matrix.dropdownOptions[columnIndex]) return;
    
    const updatedOptions = [...item.matrix.dropdownOptions];
    updatedOptions[columnIndex] = updatedOptions[columnIndex].filter((_, i) => i !== optionIndex);
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        dropdownOptions: updatedOptions
      }
    });
  };
  
  return (
    <div className="bg-white rounded-lg">
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
            value={item.type}
            disabled
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="blank">Open Answer</option>
            <option value="demographics">Demographics</option>
            <option value="primaryInsurance">Primary Insurance</option>
            <option value="secondaryInsurance">Secondary Insurance</option>
            <option value="allergies">Allergies Matrix</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="questionText" className="block text-sm font-medium text-gray-700">
            Question
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRequired"
              name="isRequired"
              checked={item.isRequired}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900">
              Is Required
            </label>
          </div>
        </div>
        <textarea
          id="questionText"
          name="questionText"
          value={item.questionText}
          onChange={handleChange}
          rows={3}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Type your question text here"
        />
      </div>
      
      {item.type === 'blank' && (
        <>
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="multipleLines"
                name="multipleLines"
                checked={item.multipleLines}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="multipleLines" className="ml-2 block text-sm text-gray-900">
                Provide multiple lines for answer
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              id="placeholder"
              name="placeholder"
              value={item.placeholder || ''}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter placeholder text"
            />
          </div>
        </>
      )}
      
      {(item.type === 'demographics' || item.type === 'primaryInsurance' || item.type === 'secondaryInsurance') && (
        <div className="mb-6">
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
            Block Instructions (optional)
          </label>
          <textarea
            id="instructions"
            value={item.instructions || ''}
            onChange={handleInstructionsChange}
            rows={3}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter instructions for this section"
          />
        </div>
      )}
      
      {item.type === 'demographics' && item.demographicFields && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Demographic Fields</h3>
          <div className="space-y-4">
            {item.demographicFields.map((field, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name
                    </label>
                    <input
                      type="text"
                      value={field.fieldName}
                      onChange={(e) => handleDemographicFieldChange(index, 'fieldName', e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Type
                    </label>
                    <select
                      value={field.fieldType}
                      onChange={(e) => handleDemographicFieldChange(index, 'fieldType', e.target.value)}
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
                      onChange={(e) => handleDemographicFieldChange(index, 'required', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-900">
                      Required
                    </label>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeDemographicField(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addDemographicField}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </button>
          </div>
        </div>
      )}
      
      {(item.type === 'primaryInsurance' || item.type === 'secondaryInsurance') && item.insuranceFields && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Insurance Fields</h3>
          <div className="space-y-4">
            {item.insuranceFields.map((field, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name
                    </label>
                    <input
                      type="text"
                      value={field.fieldName}
                      onChange={(e) => handleInsuranceFieldChange(index, 'fieldName', e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Type
                    </label>
                    <select
                      value={field.fieldType}
                      onChange={(e) => handleInsuranceFieldChange(index, 'fieldType', e.target.value)}
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
                      onChange={(e) => handleInsuranceFieldChange(index, 'required', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-900">
                      Required
                    </label>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeInsuranceField(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addInsuranceField}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </button>
          </div>
        </div>
      )}
      
      {item.type === 'allergies' && item.matrix && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Matrix</h3>
          
          <div className="mb-4">
            <label htmlFor="rowHeader" className="block text-sm font-medium text-gray-700 mb-1">
              Row Header (optional)
            </label>
            <input
              type="text"
              id="rowHeader"
              value={item.matrix.rowHeader || ''}
              onChange={(e) => handleMatrixChange('rowHeader', e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Row Header (optional)"
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Column Type
                  </th>
                  {item.matrix.columnHeaders.map((header, index) => (
                    <th key={index} className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => handleColumnHeaderChange(index, e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Column Header"
                        />
                        <button
                          type="button"
                          onClick={() => removeMatrixColumn(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2">
                        <select
                          value={item.matrix.columnTypes[index] || 'text'}
                          onChange={(e) => handleColumnTypeChange(index, e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="text">Text</option>
                          <option value="dropdown">Dropdown</option>
                        </select>
                      </div>
                      
                      {item.matrix.columnTypes[index] === 'dropdown' && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setShowFieldOptions(showFieldOptions === index ? null : index)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {showFieldOptions === index ? 'Hide Options' : 'Edit Options'}
                          </button>
                          
                          {showFieldOptions === index && (
                            <div className="mt-2 border border-gray-200 rounded-md p-2 bg-gray-50">
                              <div className="mb-2">
                                <div className="flex">
                                  <input
                                    type="text"
                                    id={`new-dropdown-option-${index}`}
                                    placeholder="Add option"
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                        addDropdownOption(index, (e.target as HTMLInputElement).value.trim());
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById(`new-dropdown-option-${index}`) as HTMLInputElement;
                                      if (input.value.trim()) {
                                        addDropdownOption(index, input.value.trim());
                                        input.value = '';
                                      }
                                    }}
                                    className="inline-flex items-center px-2 py-1 border border-l-0 border-gray-300 shadow-sm text-xs font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                              
                              <ul className="space-y-1 max-h-32 overflow-y-auto">
                                {item.matrix.dropdownOptions[index]?.map((option, optionIndex) => (
                                  <li key={optionIndex} className="flex justify-between items-center py-1 px-2 hover:bg-gray-100 rounded text-xs">
                                    <span>{option}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeDropdownOption(index, optionIndex)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="px-3 py-2 bg-gray-50">
                    <button
                      type="button"
                      onClick={addMatrixColumn}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {item.matrix.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={row}
                          onChange={(e) => {
                            const updatedRows = [...item.matrix!.rows];
                            updatedRows[rowIndex] = e.target.value;
                            handleMatrixChange('rows', updatedRows);
                          }}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeMatrixRow(rowIndex)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    {item.matrix.columnHeaders.map((_, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-500">
                        Client Answer
                      </td>
                    ))}
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <button
              type="button"
              onClick={addMatrixRow}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Row
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>*Empty columns/rows will not show up in the form.</p>
            <p>**Enumerate the rows (1,2,3,etc) and the system will let the user add more rows</p>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="displayTextBox"
                checked={item.matrix.displayTextBox}
                onChange={(e) => handleMatrixChange('displayTextBox', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="displayTextBox" className="ml-2 block text-sm text-gray-900">
                Display text box at the end for further explanation
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientIntakeFormEditor;