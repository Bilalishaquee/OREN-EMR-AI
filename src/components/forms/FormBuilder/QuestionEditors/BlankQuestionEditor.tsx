import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
// This component is kept for backward compatibility.
// New code should use OpenAnswerQuestionEditor instead.

interface BlankQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    placeholder?: string;
    multipleLines?: boolean;
  };
  onChange: (updatedItem: any) => void;
}

const BlankQuestionEditor: React.FC<BlankQuestionProps> = ({ item, onChange }) => {
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
  
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Open Answer Question</h2>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
            >
              Question Options
            </button>
          </div>
        </div>
        
        <div className="relative">
          <select
            value="text"
            onChange={(e) => {
              // This would normally change the question type
              // For this example, we're keeping it as a blank question
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md transition-colors duration-200"
          >
            <option value="text">Open Answer</option>
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
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded transition-colors duration-200"
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
          className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Type your question text here"
        />
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="multipleLines"
            name="multipleLines"
            checked={item.multipleLines}
            onChange={handleChange}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded transition-colors duration-200"
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
          className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Enter placeholder text"
        />
      </div>
      
      {/* Preview Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
        <div className="bg-white p-3 rounded border border-gray-300">
          <p className="text-sm text-gray-800 mb-2">{item.questionText || 'Your question will appear here'}</p>
          {item.multipleLines ? (
            <textarea 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" 
              rows={3} 
              placeholder={item.placeholder || 'Answer here...'}
              disabled
            />
          ) : (
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" 
              placeholder={item.placeholder || 'Answer here...'}
              disabled
            />
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
        >
          Duplicate
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default BlankQuestionEditor;