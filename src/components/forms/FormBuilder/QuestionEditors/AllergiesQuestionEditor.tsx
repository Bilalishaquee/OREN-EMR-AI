import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AllergiesQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    matrix?: {
      rowHeader?: string;
      columnHeaders: string[];
      columnTypes: string[];
      rows: string[];
      dropdownOptions: string[][];
      displayTextBox: boolean;
    };
  };
  onChange: (updatedItem: any) => void;
}

const AllergiesQuestionEditor: React.FC<AllergiesQuestionProps> = ({ item, onChange }) => {
  const [showColumnOptions, setShowColumnOptions] = useState<number | null>(null);
  
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
  
  const handleRowChange = (index: number, value: string) => {
    if (!item.matrix) return;
    
    const updatedRows = [...item.matrix.rows];
    updatedRows[index] = value;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        rows: updatedRows
      }
    });
  };
  
  const addColumn = () => {
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
  
  const removeColumn = (index: number) => {
    if (!item.matrix) return;
    
    const updatedHeaders = item.matrix.columnHeaders.filter((_, i) => i !== index);
    const updatedTypes = item.matrix.columnTypes.filter((_, i) => i !== index);
    const updatedOptions = item.matrix.dropdownOptions.filter((_, i) => i !== index);
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        columnHeaders: updatedHeaders,
        columnTypes: updatedTypes,
        dropdownOptions: updatedOptions
      }
    });
  };
  
  const addRow = () => {
    if (!item.matrix) return;
    
    const newRowNumber = item.matrix.rows.length + 1;
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        rows: [...item.matrix.rows, newRowNumber.toString()]
      }
    });
  };
  
  const removeRow = (index: number) => {
    if (!item.matrix) return;
    
    const updatedRows = item.matrix.rows.filter((_, i) => i !== index);
    
    onChange({
      ...item,
      matrix: {
        ...item.matrix,
        rows: updatedRows
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
    <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Allergies Question</h2>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Question Options
            </button>
          </div>
        </div>
        
        <div className="relative">
          <select
            value="matrix"
            disabled
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md transition-colors duration-200"
          >
            <option value="matrix">Matrix</option>
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
              onChange={(e) => onChange({ ...item, isRequired: e.target.checked })}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-colors duration-200"
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
          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Please enter the details of any allergies"
        />
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Allergies Matrix</h3>
        
        <div className="mb-4">
          <label htmlFor="rowHeader" className="block text-sm font-medium text-gray-700 mb-1">
            Row Header (optional)
          </label>
          <input
            type="text"
            id="rowHeader"
            value={item.matrix?.rowHeader || ''}
            onChange={(e) => handleMatrixChange('rowHeader', e.target.value)}
            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
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
                {item.matrix?.columnHeaders.map((header, index) => (
                  <th key={index} className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleColumnHeaderChange(index, e.target.value)}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
                        placeholder="Column Header"
                      />
                      <button
                        type="button"
                        onClick={() => removeColumn(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <select
                        value={item.matrix?.columnTypes[index] || 'text'}
                        onChange={(e) => handleColumnTypeChange(index, e.target.value)}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
                      >
                        <option value="text">Text</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                    </div>
                    {item.matrix?.columnTypes[index] === 'dropdown' && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setShowColumnOptions(showColumnOptions === index ? null : index)}
                          className="text-xs text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          {showColumnOptions === index ? 'Hide Options' : 'Edit Options'}
                        </button>
                        
                        {showColumnOptions === index && (
                          <div className="mt-2 border border-gray-200 rounded-md p-2 bg-gray-50">
                            <div className="mb-2">
                              <div className="flex">
                                <input
                                  type="text"
                                  id={`new-dropdown-option-${index}`}
                                  placeholder="Add option"
                                  className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-l-md transition-colors duration-200"
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
                                  className="inline-flex items-center px-2 py-1 border border-l-0 border-gray-300 shadow-sm text-xs font-medium rounded-r-md text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                            
                            <ul className="space-y-1 max-h-32 overflow-y-auto">
                              {item.matrix?.dropdownOptions[index]?.map((option, optionIndex) => (
                                <li key={optionIndex} className="flex justify-between items-center py-1 px-2 hover:bg-gray-100 rounded text-xs">
                                  <span>{option}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeDropdownOption(index, optionIndex)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash className="h-3 w-3" />
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
                    onClick={addColumn}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {item.matrix?.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={row}
                        onChange={(e) => handleRowChange(rowIndex, e.target.value)}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(rowIndex)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  {item.matrix?.columnHeaders.map((_, colIndex) => (
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
            onClick={addRow}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
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
              checked={item.matrix?.displayTextBox || false}
              onChange={(e) => handleMatrixChange('displayTextBox', e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-colors duration-200"
            />
            <label htmlFor="displayTextBox" className="ml-2 block text-sm text-gray-900">
              Display text box at the end for further explanation
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
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

export default AllergiesQuestionEditor;