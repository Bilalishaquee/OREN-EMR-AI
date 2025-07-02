import React from 'react';

interface SectionTitleQuestionProps {
  item: {
    type: string;
    questionText: string;
    sectionContent?: string;
  };
  onChange: (updatedItem: any) => void;
}

const SectionTitleQuestionEditor: React.FC<SectionTitleQuestionProps> = ({ item, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...item,
      [name]: value
    });
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Section Title / Note</h2>
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-1">
          Section Title
        </label>
        <input
          type="text"
          id="questionText"
          name="questionText"
          value={item.questionText}
          onChange={handleChange}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Enter section title"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="sectionContent" className="block text-sm font-medium text-gray-700 mb-1">
          Section Content
        </label>
        <textarea
          id="sectionContent"
          name="sectionContent"
          value={item.sectionContent || ''}
          onChange={handleChange}
          rows={5}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Enter section content or instructions"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Preview</h3>
        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-2">{item.questionText || 'Section Title'}</h4>
          <p className="text-sm text-gray-600">{item.sectionContent || 'Section content will appear here...'}</p>
        </div>
      </div>
    </div>
  );
};

export default SectionTitleQuestionEditor;