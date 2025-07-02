import React from 'react';
import { Plus, Trash, CheckCircle, Circle } from 'lucide-react';
import QuestionButton from '../QuestionButton';
import QuestionControl from '../QuestionControl';

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
    <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-indigo-500">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-md mr-3">
              <Circle className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Multiple Choice - Single Answer</h2>
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors duration-200"
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
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white transition-colors duration-200"
          placeholder="Type your question text here"
        />
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Answer Options</h3>
          <QuestionButton
            icon={Plus}
            label="Add Option"
            onClick={addOption}
            color="#4F46E5"
            bgColor="bg-indigo-50"
            hoverColor="hover:bg-indigo-100"
            textColor="text-indigo-700"
            size="md"
            variant="solid"
          />
        </div>
        
        {item.options && item.options.length > 0 ? (
          <div className="space-y-3">
            {item.options.map((option, index) => (
              <div key={index} className="flex items-center bg-gray-50 p-1.5 rounded-md hover:bg-indigo-50 transition-colors duration-200">
                <div className="flex-shrink-0 mr-2">
                  <div className="h-5 w-5 border-2 border-indigo-500 rounded-full flex items-center justify-center bg-white">
                    {index === 0 && <div className="h-2.5 w-2.5 bg-indigo-500 rounded-full"></div>}
                  </div>
                </div>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white transition-colors duration-200"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="ml-2 text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-indigo-300 rounded-md bg-indigo-50">
            <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Circle className="h-6 w-6 text-indigo-600" />
            </div>
            <p className="text-sm text-indigo-700 font-medium mb-2">
              No options added yet
            </p>
            <p className="text-xs text-indigo-500 mb-4">
              Add options for users to choose from
            </p>
            <QuestionButton
              icon={Plus}
              label="Add Your First Option"
              onClick={addOption}
              color="#4F46E5"
              bgColor="bg-indigo-50"
              hoverColor="hover:bg-indigo-100"
              textColor="text-indigo-700"
              size="sm"
              variant="outline"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MultipleChoiceSingleQuestionEditor;