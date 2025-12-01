import React from 'react';
import QuestionnaireCard from './QuestionnaireCard';
import { Plus, Upload, FileText } from 'lucide-react';

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
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-sm text-gray-600">{forms.length} {forms.length === 1 ? 'form' : 'forms'} available</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
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
          className="flex flex-col h-48 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer hover:border-amber-400 hover:shadow-lg hover:bg-amber-50/30 transform hover:-translate-y-1 transition-all duration-200 group"
          onClick={onUploadExisting}
        >
          <div className="flex-1 flex flex-col justify-center items-center p-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-3 group-hover:from-amber-200 group-hover:to-amber-300 transition-all">
              <Upload className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-amber-600 text-center font-semibold text-sm group-hover:text-amber-700 transition-colors">Upload Existing Form</h3>
            <p className="text-xs text-gray-500 mt-1 text-center">Import from file</p>
          </div>
        </div>
        
        {/* Create New Form Card */}
        <div 
          className="flex flex-col h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border-2 border-blue-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-lg hover:from-blue-100 hover:to-blue-200 transform hover:-translate-y-1 transition-all duration-200 group"
          onClick={onCreateNew}
        >
          <div className="flex-1 flex flex-col justify-center items-center p-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 group-hover:from-blue-600 group-hover:to-blue-700 shadow-md transition-all">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-blue-700 text-center font-semibold text-sm group-hover:text-blue-800 transition-colors">Create New Form</h3>
            <p className="text-xs text-blue-600 mt-1 text-center">Start from scratch</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnairesSection;