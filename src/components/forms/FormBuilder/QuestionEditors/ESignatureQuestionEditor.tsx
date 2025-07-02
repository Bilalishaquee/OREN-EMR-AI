import React from 'react';

interface ESignatureQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    signaturePrompt?: string;
  };
  onChange: (updatedItem: any) => void;
}

const ESignatureQuestionEditor: React.FC<ESignatureQuestionProps> = ({ item, onChange }) => {
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
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">E-Signature</h2>
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
        <label htmlFor="signaturePrompt" className="block text-sm font-medium text-gray-700 mb-1">
          Signature Prompt
        </label>
        <textarea
          id="signaturePrompt"
          name="signaturePrompt"
          value={item.signaturePrompt || 'I confirm that the information provided is accurate and complete.'}
          onChange={handleChange}
          rows={3}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Enter the text that will appear above the signature field"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Preview</h3>
        <div className="border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-900 mb-2">{item.questionText || 'Please sign below'}</p>
          <p className="text-xs text-gray-600 mb-4">{item.signaturePrompt || 'I confirm that the information provided is accurate and complete.'}</p>
          <div className="border-2 border-dashed border-gray-300 rounded-md h-32 flex items-center justify-center">
            <p className="text-gray-400">Signature will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESignatureQuestionEditor;