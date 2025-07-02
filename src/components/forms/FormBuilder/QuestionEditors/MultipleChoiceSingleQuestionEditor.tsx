import React from 'react';
import { Plus, Trash } from 'lucide-react';

interface MultipleChoiceSingleQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    options?: string[];
  };
  onChange: (updatedItem: any) => void;
}

const MultipleChoiceSingleQuestionEditor: React.FC<MultipleChoiceSingleQuestionProps> = ({ item, onChange }) => {
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

  const addOption = () => {
    const newOptions = [...(item.options || []), `Option ${(item.options?.length || 0) + 1}`];
    onChange({
      ...item,
      options: newOptions
    });
  };

  const updateOption = (index: number, value: string) => {
    if (!item.options) return;
    
    const updatedOptions = [...item.options];
    updatedOptions[index] = value;
    
    onChange({
      ...item,
      options: updatedOptions
    });
  };

  const removeOption = (index: number) => {
    if (!item.options) return;
    
    const updatedOptions = item.options.filter((_, i) => i !== index);
    
    onChange({
      ...item,
      options: updatedOptions
    });
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Multiple Choice - Single Answer</h2>
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Answer Options</h3>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </button>
        </div>
        
        {item.options && item.options.length > 0 ? (
          <div className="space-y-3">
            {item.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-shrink-0 mr-2">
                  <div className="h-5 w-5 border border-gray-300 rounded-full"></div>
                </div>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
            No options added yet. Click "Add Option" to add your first option.
          </p>
        )}
      </div>
    </div>
  );
};

export default MultipleChoiceSingleQuestionEditor;