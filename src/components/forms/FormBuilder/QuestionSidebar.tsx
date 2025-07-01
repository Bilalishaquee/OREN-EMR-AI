import React from 'react';
import { Plus, Copy, Trash } from 'lucide-react';

interface FormItem {
  _id?: string;
  type: string;
  questionText: string;
  isRequired: boolean;
}

interface QuestionSidebarProps {
  items: FormItem[];
  currentItemIndex: number | null;
  onSelectItem: (index: number) => void;
  onAddItem: (type: string) => void;
  onDuplicateItem: (index: number) => void;
  onDeleteItem: (index: number) => void;
}

const QuestionSidebar: React.FC<QuestionSidebarProps> = ({
  items,
  currentItemIndex,
  onSelectItem,
  onAddItem,
  onDuplicateItem,
  onDeleteItem
}) => {
  // Question type options
  const questionTypes = [
    { type: 'blank', label: 'Add Blank Question' },
    { type: 'demographics', label: 'Add Demographics Question' },
    { type: 'primaryInsurance', label: 'Add Primary Insurance Question' },
    { type: 'secondaryInsurance', label: 'Add Secondary Insurance Question' },
    { type: 'allergies', label: 'Add Allergies Question' }
  ];
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Question type buttons */}
      <div className="border-b border-gray-200">
        {questionTypes.map((qType) => (
          <button
            key={qType.type}
            onClick={() => onAddItem(qType.type)}
            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm font-medium text-gray-700"
          >
            {qType.label}
          </button>
        ))}
      </div>
      
      {/* Question list */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
        {items.length > 0 ? (
          <ul>
            {items.map((item, index) => (
              <li 
                key={index}
                className={`relative border-b border-gray-100 last:border-b-0 ${
                  currentItemIndex === index ? 'bg-blue-50' : ''
                }`}
              >
                <button
                  onClick={() => onSelectItem(index)}
                  className="w-full text-left px-4 py-3 pr-20 hover:bg-gray-50"
                >
                  <div className="font-medium text-sm truncate">
                    {item.questionText || `Question ${index + 1}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.type === 'blank' ? 'Blank Question' : 
                     item.type === 'demographics' ? 'Demographics' :
                     item.type === 'primaryInsurance' ? 'Primary Insurance' :
                     item.type === 'secondaryInsurance' ? 'Secondary Insurance' :
                     item.type === 'allergies' ? 'Allergies' : 
                     item.type}
                    {item.isRequired && ' (Required)'}
                  </div>
                </button>
                
                {/* Action buttons */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateItem(index);
                    }}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(index);
                    }}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No questions added yet</p>
            <p className="text-sm mt-2">Click on a question type above to add one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionSidebar;