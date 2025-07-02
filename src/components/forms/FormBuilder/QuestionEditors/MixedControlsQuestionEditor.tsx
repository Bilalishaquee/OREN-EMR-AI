import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';

interface MixedControlsQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    instructions?: string;
    mixedControlsConfig?: Array<{
      controlType: string;
      label: string;
      required: boolean;
      placeholder?: string;
      options?: string[];
    }>;
  };
  onChange: (updatedItem: any) => void;
}

const MixedControlsQuestionEditor: React.FC<MixedControlsQuestionProps> = ({ item, onChange }) => {
  const [showControlOptions, setShowControlOptions] = useState<number | null>(null);
  
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

  const handleControlChange = (index: number, field: string, value: any) => {
    if (!item.mixedControlsConfig) return;
    
    const updatedControls = [...item.mixedControlsConfig];
    updatedControls[index] = {
      ...updatedControls[index],
      [field]: value
    };
    
    onChange({
      ...item,
      mixedControlsConfig: updatedControls
    });
  };

  const addControl = () => {
    const newControl = {
      controlType: 'text',
      label: 'New Field',
      required: false,
      placeholder: ''
    };
    
    onChange({
      ...item,
      mixedControlsConfig: [...(item.mixedControlsConfig || []), newControl]
    });
  };

  const removeControl = (index: number) => {
    if (!item.mixedControlsConfig) return;
    
    const updatedControls = item.mixedControlsConfig.filter((_, i) => i !== index);
    
    onChange({
      ...item,
      mixedControlsConfig: updatedControls
    });
  };

  const addOption = (controlIndex: number) => {
    if (!item.mixedControlsConfig) return;
    
    const control = item.mixedControlsConfig[controlIndex];
    if (!control) return;
    
    const updatedControls = [...item.mixedControlsConfig];
    updatedControls[controlIndex] = {
      ...control,
      options: [...(control.options || []), `Option ${(control.options?.length || 0) + 1}`]
    };
    
    onChange({
      ...item,
      mixedControlsConfig: updatedControls
    });
  };

  const updateOption = (controlIndex: number, optionIndex: number, value: string) => {
    if (!item.mixedControlsConfig) return;
    
    const control = item.mixedControlsConfig[controlIndex];
    if (!control || !control.options) return;
    
    const updatedOptions = [...control.options];
    updatedOptions[optionIndex] = value;
    
    const updatedControls = [...item.mixedControlsConfig];
    updatedControls[controlIndex] = {
      ...control,
      options: updatedOptions
    };
    
    onChange({
      ...item,
      mixedControlsConfig: updatedControls
    });
  };

  const removeOption = (controlIndex: number, optionIndex: number) => {
    if (!item.mixedControlsConfig) return;
    
    const control = item.mixedControlsConfig[controlIndex];
    if (!control || !control.options) return;
    
    const updatedOptions = control.options.filter((_, i) => i !== optionIndex);
    
    const updatedControls = [...item.mixedControlsConfig];
    updatedControls[controlIndex] = {
      ...control,
      options: updatedOptions
    };
    
    onChange({
      ...item,
      mixedControlsConfig: updatedControls
    });
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Mixed Controls Question</h2>
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
      
      <div className="mb-6">
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
          Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          value={item.instructions || ''}
          onChange={handleChange}
          rows={2}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Add instructions for this question"
        />
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Controls</h3>
          <button
            type="button"
            onClick={addControl}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Control
          </button>
        </div>
        
        {item.mixedControlsConfig && item.mixedControlsConfig.length > 0 ? (
          <div className="space-y-4">
            {item.mixedControlsConfig.map((control, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Control {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeControl(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Control Type
                    </label>
                    <select
                      value={control.controlType}
                      onChange={(e) => handleControlChange(index, 'controlType', e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Text Area</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="checkbox">Checkboxes</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={control.label}
                      onChange={(e) => handleControlChange(index, 'label', e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Field Label"
                    />
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id={`control-${index}-required`}
                    checked={control.required}
                    onChange={(e) => handleControlChange(index, 'required', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`control-${index}-required`} className="ml-2 block text-sm text-gray-900">
                    Required
                  </label>
                </div>
                
                {(control.controlType === 'text' || control.controlType === 'textarea') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={control.placeholder || ''}
                      onChange={(e) => handleControlChange(index, 'placeholder', e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Placeholder text"
                    />
                  </div>
                )}
                
                {(control.controlType === 'dropdown' || control.controlType === 'radio' || control.controlType === 'checkbox') && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(index)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </button>
                    </div>
                    
                    {control.options && control.options.length > 0 ? (
                      <div className="space-y-2">
                        {control.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(index, optionIndex)}
                              className="ml-2 text-red-600 hover:text-red-800"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No options added yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
            No controls added yet. Click "Add Control" to add your first control.
          </p>
        )}
      </div>
    </div>
  );
};

export default MixedControlsQuestionEditor;