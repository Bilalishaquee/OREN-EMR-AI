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
    <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-teal-500">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-teal-100 p-2 rounded-md mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Section Title</h2>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <span className="bg-teal-100 p-1 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </span>
          Section Title
        </label>
        <input
          type="text"
          id="questionText"
          name="questionText"
          value={item.questionText}
          onChange={handleChange}
          className="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Enter section title"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="sectionContent" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <span className="bg-teal-100 p-1 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
          Content
        </label>
        <textarea
          id="sectionContent"
          name="sectionContent"
          value={item.sectionContent || ''}
          onChange={handleChange}
          rows={4}
          className="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Enter section content or instructions"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <span className="bg-teal-100 p-1 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </span>
          Preview
        </h3>
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 hover:shadow-md transition-all duration-200">
          <h3 className="text-lg font-medium text-teal-900 mb-2 border-b border-teal-200 pb-2">{item.questionText || 'Section Title'}</h3>
          <p className="text-sm text-gray-600">{item.sectionContent || 'Section content or instructions'}</p>
        </div>
      </div>
    </div>
  );
};

export default SectionTitleQuestionEditor;