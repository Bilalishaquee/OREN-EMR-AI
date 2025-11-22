import React, { useState } from 'react';
import { Plus, Trash, Circle, CheckSquare } from 'lucide-react';

interface MultipleChoiceOption {
  id: string;
  text: string;
}

const DebugMultipleChoice: React.FC = () => {
  const [singleOptions, setSingleOptions] = useState<MultipleChoiceOption[]>([
    { id: '1', text: 'Option 1' },
    { id: '2', text: 'Option 2' },
    { id: '3', text: 'Option 3' },
  ]);

  const [multipleOptions, setMultipleOptions] = useState<MultipleChoiceOption[]>([
    { id: '1', text: 'Option 1' },
    { id: '2', text: 'Option 2' },
    { id: '3', text: 'Option 3' },
  ]);

  // Single choice functions
  const addSingleOption = () => {
    const newOption = {
      id: Date.now().toString(),
      text: `Option ${singleOptions.length + 1}`,
    };
    setSingleOptions([...singleOptions, newOption]);
  };

  const updateSingleOption = (id: string, newText: string) => {
    setSingleOptions(
      singleOptions.map((option) =>
        option.id === id ? { ...option, text: newText } : option
      )
    );
  };

  const removeSingleOption = (id: string) => {
    setSingleOptions(singleOptions.filter((option) => option.id !== id));
  };

  // Multiple choice functions
  const addMultipleOption = () => {
    const newOption = {
      id: Date.now().toString(),
      text: `Option ${multipleOptions.length + 1}`,
    };
    setMultipleOptions([...multipleOptions, newOption]);
  };

  const updateMultipleOption = (id: string, newText: string) => {
    setMultipleOptions(
      multipleOptions.map((option) =>
        option.id === id ? { ...option, text: newText } : option
      )
    );
  };

  const removeMultipleOption = (id: string) => {
    setMultipleOptions(multipleOptions.filter((option) => option.id !== id));
  };

  return (
    <div className="p-8 space-y-12">
      {/* Single Choice Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-indigo-500">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-md mr-3">
                <Circle className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Multiple Choice - Single Answer (Debug)
              </h2>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900">Answer Options</h3>
            <button
              onClick={addSingleOption}
              className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add Option</span>
            </button>
          </div>

          <div className="space-y-3">
            {singleOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center bg-gray-50 p-1.5 rounded-md hover:bg-indigo-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0 mr-2">
                  <div className="h-5 w-5 border-2 border-indigo-500 rounded-full flex items-center justify-center bg-white">
                    {option.id === '1' && (
                      <div className="h-2.5 w-2.5 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateSingleOption(option.id, e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder={`Option ${option.id}`}
                />
                <button
                  type="button"
                  onClick={() => removeSingleOption(option.id)}
                  className="ml-2 text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multiple Choice Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-purple-500">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-md mr-3">
                <CheckSquare className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Multiple Choice - Multiple Answers (Debug)
              </h2>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900">
              Answer Options (Select Multiple)
            </h3>
            <button
              onClick={addMultipleOption}
              className="flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add Option</span>
            </button>
          </div>

          <div className="space-y-3">
            {multipleOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center bg-gray-50 p-2 rounded-md hover:bg-purple-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0 mr-2">
                  <div className="h-5 w-5 border border-purple-300 rounded"></div>
                </div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateMultipleOption(option.id, e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder={`Option ${option.id}`}
                />
                <button
                  type="button"
                  onClick={() => removeMultipleOption(option.id)}
                  className="ml-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugMultipleChoice;