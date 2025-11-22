import React from 'react';
import { FileText, AlignLeft, CheckSquare, CheckCircle, Grid, Table, Heading, FileUp, Edit3, PenTool, Layout } from 'lucide-react';

interface QuestionTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({ value, onChange }) => {
  const questionTypes = [
    { value: 'mixedControls', label: 'Mixed Controls', icon: Layout, color: '#4F46E5' },
    { value: 'openAnswer', label: 'Open Answer', icon: AlignLeft, color: '#10B981' },
    { value: 'multipleChoiceSingle', label: 'Multiple Choice - Single Answer', icon: CheckCircle, color: '#F59E0B' },
    { value: 'multipleChoiceMultiple', label: 'Multiple Choice - Multiple Answer', icon: CheckSquare, color: '#EC4899' },
    { value: 'matrix', label: 'Matrix', icon: Grid, color: '#8B5CF6' },
    { value: 'matrixSingleAnswer', label: 'Matrix - Single Answer per Line', icon: Table, color: '#6366F1' },
    { value: 'sectionTitle', label: 'Section Title / Note', icon: Heading, color: '#0EA5E9' },
    { value: 'fileAttachment', label: 'File Attachment', icon: FileUp, color: '#14B8A6' },
    { value: 'eSignature', label: 'e-Signature', icon: Edit3, color: '#EF4444' },
    { value: 'smartEditor', label: 'Smart Editor', icon: FileText, color: '#F97316' },
    { value: 'bodyMap', label: 'Body Map / Drawing', icon: PenTool, color: '#06B6D4' }
  ];
  
  // Find the selected question type
  const selectedType = questionTypes.find(type => type.value === value) || questionTypes[0];
  
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        Question Type
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {React.createElement(selectedType.icon, { 
            className: "h-5 w-5", 
            style: { color: selectedType.color } 
          })}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pl-10 pr-10 py-2.5 text-base border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm transition duration-150 ease-in-out hover:border-indigo-300"
          style={{ borderLeft: `4px solid ${selectedType.color}` }}
        >
          {questionTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default QuestionTypeSelector;