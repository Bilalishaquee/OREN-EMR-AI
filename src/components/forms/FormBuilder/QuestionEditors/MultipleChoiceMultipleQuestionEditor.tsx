import React from 'react';
import { Plus, Trash, CheckSquare, Square } from 'lucide-react';
import QuestionButton from "../QuestionButton";
import QuestionControl from "../QuestionControl";

interface MultipleChoiceMultipleQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    options?: string[];
  };
  onChange: (updatedItem: any) => void;
}

const MultipleChoiceMultipleQuestionEditor: React.FC<MultipleChoiceMultipleQuestionProps> = ({ item, onChange }) => {
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
    <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-purple-500">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-md mr-3">
              <CheckSquare className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Multiple Choice - Multiple Answers</h2>
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Answer Options (Select Multiple)</h3>
          <QuestionButton
            icon={Plus}
            label="Add Option"
            onClick={addOption}
            color="#9333EA"
            bgColor="bg-purple-50"
            hoverColor="hover:bg-purple-100"
            textColor="text-purple-700"
            size="md"
            variant="solid"
          />
        </div>
        
        {item.options && item.options.length > 0 ? (
          <div className="space-y-3">
            {item.options.map((option, index) => (
              <div key={index} className="flex items-center bg-gray-50 p-2 rounded-md hover:bg-purple-50 transition-colors duration-200">
                <div className="flex-shrink-0 mr-2">
                  <div className="h-5 w-5 border border-purple-300 rounded"></div>
                </div>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="ml-2 text-red-600 hover:text-red-800 transition-colors duration-200"
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

export default MultipleChoiceMultipleQuestionEditor;