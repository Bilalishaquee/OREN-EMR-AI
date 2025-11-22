import React from 'react';
import QuestionnaireCard from './QuestionnaireCard';

interface FormItem {
  id: string;
  title: string;
  color: string;
  isShared?: boolean;
  isPdf?: boolean;
}

interface QuestionnairesSectionProps {
  title: string;
  forms: FormItem[];
  onFormClick: (formId: string) => void;
  onCreateNew: () => void;
  onUploadExisting: () => void;
}

const QuestionnairesSection: React.FC<QuestionnairesSectionProps> = ({ 
  title, 
  forms, 
  onFormClick,
  onCreateNew,
  onUploadExisting
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Display all form cards */}
        {forms.map(form => (
          <QuestionnaireCard
            key={form.id}
            title={form.title}
            color={form.color}
            isShared={form.isShared}
            isPdf={form.isPdf}
            onClick={() => onFormClick(form.id)}
          />
        ))}
        
        {/* Upload Existing Form Card */}
        <div 
          className="flex flex-col h-40 bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={onUploadExisting}
        >
          <div className="flex-1 flex flex-col justify-center items-center p-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-amber-500 text-center font-medium">Upload Existing Form</h3>
          </div>
        </div>
        
        {/* Create New Form Card */}
        <div 
          className="flex flex-col h-40 bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={onCreateNew}
        >
          <div className="flex-1 flex flex-col justify-center items-center p-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-green-500 text-center font-medium">Create New</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnairesSection;