import React, { useState } from 'react';
import { Plus, Trash, Settings, Type, List, Calendar } from 'lucide-react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import QuestionButton from '../QuestionButton';
import QuestionControl from '../QuestionControl';

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
    <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Mixed Controls Question</h2>
          </div>
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
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors duration-200"
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
          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
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
          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Add instructions for this question"
        />
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Controls</h3>
          <QuestionButton
            icon={Plus}
            label="Add Control"
            onClick={addControl}
            color="#8B5CF6"
            bgColor="bg-purple-50"
            hoverColor="hover:bg-purple-100"
            textColor="text-purple-700"
            size="md"
            variant="solid"
          />
        </div>
        
        {item.mixedControlsConfig && item.mixedControlsConfig.length > 0 ? (
          <div className="space-y-4">
            {item.mixedControlsConfig.map((control, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-1.5 rounded-md mr-2">
                      {control.controlType === 'text' && <Type className="h-3.5 w-3.5 text-purple-600" />}
                      {control.controlType === 'textarea' && <Type className="h-3.5 w-3.5 text-purple-600" />}
                      {control.controlType === 'dropdown' && <List className="h-3.5 w-3.5 text-purple-600" />}
                      {control.controlType === 'radio' && <List className="h-3.5 w-3.5 text-purple-600" />}
                      {control.controlType === 'checkbox' && <List className="h-3.5 w-3.5 text-purple-600" />}
                      {control.controlType === 'date' && <Calendar className="h-3.5 w-3.5 text-purple-600" />}
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">Control {index + 1}: {control.label}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeControl(index)}
                    className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
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
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md transition-colors duration-200 bg-white"
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
                      className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200 bg-white"
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
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors duration-200"
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
                      className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200 bg-white"
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
                      <QuestionButton
                        icon={Plus}
                        label="Add Option"
                        onClick={() => addOption(index)}
                        color="#8B5CF6"
                        bgColor="bg-purple-50"
                        hoverColor="hover:bg-purple-100"
                        textColor="text-purple-700"
                        size="sm"
                        variant="outline"
                      />
                    </div>
                    
                    {control.options && control.options.length > 0 ? (
                      <div className="space-y-2">
                        {control.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center bg-gray-50 p-1.5 rounded-md hover:bg-gray-100 transition-colors duration-200">
                            <div className="bg-purple-100 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                              <span className="text-xs font-medium text-purple-700">{optionIndex + 1}</span>
                            </div>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(index, optionIndex)}
                              className="ml-2 text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
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
          <div className="text-center py-8 border border-dashed border-purple-300 rounded-md bg-purple-50">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <AdjustmentsHorizontalIcon className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm text-purple-700 font-medium mb-2">
              No controls added yet
            </p>
            <p className="text-xs text-purple-500 mb-4">
              Add controls to create form fields for users to fill out
            </p>
            <QuestionButton
              icon={Plus}
              label="Add Your First Control"
              onClick={addControl}
              color="#8B5CF6"
              bgColor="bg-purple-50"
              hoverColor="hover:bg-purple-100"
              textColor="text-purple-700"
              size="sm"
              variant="outline"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MixedControlsQuestionEditor;