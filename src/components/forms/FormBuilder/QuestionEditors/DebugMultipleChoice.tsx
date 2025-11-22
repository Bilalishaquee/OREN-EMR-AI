import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';

const DebugMultipleChoice: React.FC = () => {
  const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2', 'Option 3']);

  const addOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Debug Multiple Choice</h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Answer Options</h3>
          <button
            onClick={addOption}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Add Option
          </button>
        </div>
        
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={index} className="flex items-center bg-gray-50 p-2 rounded-md">
              <div className="flex-shrink-0 mr-2">
                <div className="h-5 w-5 border-2 border-blue-500 rounded-full flex items-center justify-center bg-white">
                  {index === 0 && <div className="h-2.5 w-2.5 bg-blue-500 rounded-full"></div>}
                </div>
              </div>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="ml-2 text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-md font-medium text-gray-900 mb-2">Current Options:</h3>
        <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(options, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugMultipleChoice;