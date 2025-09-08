import React from 'react';

interface OpenAnswerQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    multipleLines?: boolean;
    placeholder?: string;
  };
  onChange: (updatedItem: any) => void;
}

const OpenAnswerQuestionEditor: React.FC<OpenAnswerQuestionProps> = ({ item, onChange }) => {
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
  
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-green-500">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-md mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Open Answer</h2>
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
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors duration-200"
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
          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Type your question text here"
        />
      </div>
      
      <div className="mb-6">
        <div className="flex items-center bg-green-50 p-2 rounded-md hover:bg-green-100 transition-colors duration-200">
          <input
            type="checkbox"
            id="multipleLines"
            name="multipleLines"
            checked={item.multipleLines}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors duration-200"
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
          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Enter your answer here"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Preview</h3>
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 hover:shadow-md transition-all duration-200">
          <p className="text-sm text-gray-900 mb-2 font-medium">{item.questionText || 'Your question here'}</p>
          {item.multipleLines ? (
            <textarea
              disabled
              rows={4}
              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white"
              placeholder={item.placeholder || 'Enter your answer here'}
            />
          ) : (
            <input
              type="text"
              disabled
              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white"
              placeholder={item.placeholder || 'Enter your answer here'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenAnswerQuestionEditor;