import React, { useState } from 'react';
import { Plus, Trash, CheckSquare, Square } from 'lucide-react';

interface MultipleChoiceMultipleQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    options?: string[];
  };
  onChange: (updatedItem: any) => void;
  onAddToForm?: () => void;
  isPreview?: boolean;
}

const MultipleChoiceMultipleQuestionEditor: React.FC<MultipleChoiceMultipleQuestionProps> = ({ 
  item, 
  onChange,
  onAddToForm,
  isPreview = false 
}) => {
  const [question, setQuestion] = useState<string>(item.questionText || '');
  const [options, setOptions] = useState<string[]>(item.options || ['Option 1', 'Option 2', 'Option 3']);
  const [isRequired, setIsRequired] = useState<boolean>(item.isRequired || false);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuestion = e.target.value;
    setQuestion(newQuestion);
    onChange({
      ...item,
      questionText: newQuestion,
    });
  };

  const addOption = () => {
    const newOptions = [...options, `Option ${options.length + 1}`];
    setOptions(newOptions);
    onChange({
      ...item,
      options: newOptions,
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onChange({
      ...item,
      options: newOptions,
    });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onChange({
      ...item,
      options: newOptions,
    });
  };

  const toggleRequired = () => {
    const newIsRequired = !isRequired;
    setIsRequired(newIsRequired);
    onChange({
      ...item,
      isRequired: newIsRequired,
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
          <label htmlFor="question" className="block text-sm font-medium text-gray-700">
            Question
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              name="required"
              checked={isRequired}
              onChange={toggleRequired}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors duration-200"
            />
            <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
              Is Required
            </label>
          </div>
        </div>
        <textarea
          id="question"
          name="question"
          value={question}
          onChange={handleQuestionChange}
          rows={3}
          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white transition-colors duration-200"
          placeholder="Type your question text here"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Answer Options (Select Multiple)</h3>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors duration-200"
          >
            <Plus className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
            Add Option
          </button>
        </div>
        
        {options.length > 0 ? (
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center bg-gray-50 p-2 rounded-md hover:bg-purple-50 transition-colors duration-200">
                <div className="flex-shrink-0 mr-2">
                  <div className="h-5 w-5 border border-purple-500 rounded flex items-center justify-center bg-white">
                    {index === 0 && <CheckSquare className="h-3 w-3 text-purple-500" />}
                  </div>
                </div>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
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
          <div className="text-center py-8 border border-dashed border-purple-300 rounded-md bg-purple-50">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm text-purple-700 font-medium mb-2">
              No options added yet
            </p>
            <p className="text-xs text-purple-500 mb-4">
              Add options for users to choose from (multiple selection)
            </p>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors duration-200"
            >
              <Plus className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
              Add Your First Option
            </button>
          </div>
        )}
      </div>

      {onAddToForm && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onAddToForm}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
          >
            Add to Form
          </button>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceMultipleQuestionEditor;