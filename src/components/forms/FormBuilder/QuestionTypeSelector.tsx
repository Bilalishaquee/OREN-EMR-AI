import React from 'react';

interface QuestionTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({ value, onChange }) => {
  const questionTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date' },
    { value: 'matrix', label: 'Matrix' },
    { value: 'mixed', label: 'Mixed Controls' }
  ];
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Question Type
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          {questionTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default QuestionTypeSelector;