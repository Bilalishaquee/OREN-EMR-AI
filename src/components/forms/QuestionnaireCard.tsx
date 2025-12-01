import React from 'react';
import { FileText, MoreVertical, Globe, Lock, File } from 'lucide-react';

interface QuestionnaireCardProps {
  title: string;
  color: string;
  isShared?: boolean;
  isPdf?: boolean;
  onClick: () => void;
}

const QuestionnaireCard: React.FC<QuestionnaireCardProps> = ({ 
  title, 
  color, 
  isShared = false,
  isPdf = false,
  onClick 
}) => {
  // Map color classes to gradient variants
  const colorGradients: { [key: string]: string } = {
    'bg-purple-500': 'from-purple-500 to-purple-600',
    'bg-blue-500': 'from-blue-500 to-blue-600',
    'bg-green-500': 'from-emerald-500 to-emerald-600',
    'bg-yellow-500': 'from-amber-500 to-amber-600',
    'bg-red-500': 'from-red-500 to-red-600',
  };

  const gradientClass = colorGradients[color] || 'from-gray-500 to-gray-600';

  return (
    <div 
      className="flex flex-col h-48 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:border-gray-300 transform hover:-translate-y-1 transition-all duration-200 group"
      onClick={onClick}
    >
      {/* Colored header with shared label */}
      <div className={`flex justify-between items-center px-4 py-3 bg-gradient-to-r ${gradientClass} shadow-sm`}>
        <div className="flex items-center gap-2">
          {isShared ? (
            <Globe className="w-4 h-4 text-white" />
          ) : (
            <Lock className="w-4 h-4 text-white" />
          )}
          <span className="text-white text-xs font-semibold uppercase tracking-wide">
            {isShared ? 'Shared' : 'Private'}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle menu click
          }}
          className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/20"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      {/* Content area */}
      <div className="flex-1 flex flex-col justify-center items-center p-5 bg-gradient-to-b from-white to-gray-50">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-3 group-hover:from-gray-200 group-hover:to-gray-300 transition-all shadow-sm">
          {isPdf ? (
            <File className="w-7 h-7 text-gray-600" />
          ) : (
            <FileText className="w-7 h-7 text-gray-600" />
          )}
        </div>
        {isPdf && (
          <div className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full mb-2 font-semibold border border-blue-200">
            PDF
          </div>
        )}
        <h3 className="text-gray-900 text-center font-semibold text-sm leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
      </div>
    </div>
  );
};

export default QuestionnaireCard;