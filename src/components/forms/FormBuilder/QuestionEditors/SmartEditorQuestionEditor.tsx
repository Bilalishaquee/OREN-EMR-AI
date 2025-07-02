import React from 'react';

interface SmartEditorQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    editorContent?: string;
  };
  onChange: (updatedItem: any) => void;
}

const SmartEditorQuestionEditor: React.FC<SmartEditorQuestionProps> = ({ item, onChange }) => {
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
          <h2 className="text-lg font-medium text-gray-900">Smart Editor</h2>
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
        <label htmlFor="editorContent" className="block text-sm font-medium text-gray-700 mb-1">
          Default Content (Optional)
        </label>
        <textarea
          id="editorContent"
          name="editorContent"
          value={item.editorContent || ''}
          onChange={handleChange}
          rows={5}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Enter default content for the editor"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Preview</h3>
        <div className="border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-900 mb-2">{item.questionText || 'Please provide your response'}</p>
          <div className="border border-gray-300 rounded-md p-2">
            <div className="bg-gray-100 border-b border-gray-300 p-1 flex space-x-2 mb-2">
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-200">Bold</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-200">Italic</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-200">Underline</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-200">List</button>
              <button className="px-2 py-1 text-xs rounded hover:bg-gray-200">Link</button>
            </div>
            <div className="min-h-[100px] p-2 text-sm text-gray-600">
              {item.editorContent || 'Rich text editor content will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartEditorQuestionEditor;