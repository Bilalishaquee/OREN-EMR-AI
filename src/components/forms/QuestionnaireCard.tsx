import React from 'react';

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
  return (
    <div 
      className="flex flex-col h-40 bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={onClick}
    >
      {/* Colored header with shared label */}
      <div className={`flex justify-between items-center px-4 py-2 ${color}`}>
        <span className="text-white text-sm font-medium">Shared</span>
        <span className="text-white text-sm">•••</span>
      </div>
      
      {/* Content area */}
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        {isPdf && (
          <div className="text-xs bg-gray-100 px-2 py-1 rounded mb-2">PDF</div>
        )}
        <h3 className="text-gray-800 text-center font-medium">{title}</h3>
      </div>
    </div>
  );
};

export default QuestionnaireCard;