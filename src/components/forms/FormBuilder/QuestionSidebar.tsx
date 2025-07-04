import React, { useState } from 'react';
import { Plus, Copy, Trash, ChevronRight, ChevronDown, FileText, AlignLeft, CheckSquare, CheckCircle, Grid, Table, Heading, FileUp, Edit3, PenTool, Layout, Users, CreditCard, Shield, Thermometer } from 'lucide-react';
import QuestionButton from './QuestionButton';

interface FormItem {
  _id?: string;
  type: string;
  questionText: string;
  isRequired: boolean;
}

interface QuestionSidebarProps {
  items: FormItem[];
  currentItemIndex: number | null;
  onSelectItem: (index: number, questionType?: string) => void;
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
  // Question type options with icons and colors
  const questionTypes = [
    { type: 'openAnswer', label: 'Add Open Answer Question', icon: AlignLeft, color: '#10B981', bgColor: 'bg-green-50', hoverColor: 'hover:bg-green-100', textColor: 'text-green-700' },
    { type: 'demographics', label: 'Add Demographics Question', icon: Users, color: '#8B5CF6', bgColor: 'bg-purple-50', hoverColor: 'hover:bg-purple-100', textColor: 'text-purple-700' },
    { type: 'primaryInsurance', label: 'Add Primary Insurance Question', icon: CreditCard, color: '#3B82F6', bgColor: 'bg-blue-50', hoverColor: 'hover:bg-blue-100', textColor: 'text-blue-700' },
    { type: 'secondaryInsurance', label: 'Add Secondary Insurance Question', icon: Shield, color: '#6366F1', bgColor: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100', textColor: 'text-indigo-700' },
    { type: 'allergies', label: 'Add Allergies Question', icon: Thermometer, color: '#EF4444', bgColor: 'bg-red-50', hoverColor: 'hover:bg-red-100', textColor: 'text-red-700' }
  ];
  
  // Question subtypes for each question type with icons and colors
  const questionSubtypes = [
    { type: 'mixedControls', label: 'Mixed Controls', icon: Layout, color: '#4F46E5', bgColor: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100', textColor: 'text-indigo-700' },
    { type: 'openAnswer', label: 'Open Answer', icon: AlignLeft, color: '#10B981', bgColor: 'bg-green-50', hoverColor: 'hover:bg-green-100', textColor: 'text-green-700' },
    { type: 'multipleChoiceSingle', label: 'Multiple Choice - Single Answer', icon: CheckCircle, color: '#F59E0B', bgColor: 'bg-amber-50', hoverColor: 'hover:bg-amber-100', textColor: 'text-amber-700' },
    { type: 'multipleChoiceMultiple', label: 'Multiple Choice - Multiple Answer', icon: CheckSquare, color: '#EC4899', bgColor: 'bg-pink-50', hoverColor: 'hover:bg-pink-100', textColor: 'text-pink-700' },
    { type: 'matrix', label: 'Matrix', icon: Grid, color: '#8B5CF6', bgColor: 'bg-purple-50', hoverColor: 'hover:bg-purple-100', textColor: 'text-purple-700' },
    { type: 'matrixSingleAnswer', label: 'Matrix - Single Answer per Line', icon: Table, color: '#6366F1', bgColor: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100', textColor: 'text-indigo-700' },
    { type: 'sectionTitle', label: 'Section Title / Note', icon: Heading, color: '#0EA5E9', bgColor: 'bg-sky-50', hoverColor: 'hover:bg-sky-100', textColor: 'text-sky-700' },
    { type: 'fileAttachment', label: 'File Attachment', icon: FileUp, color: '#14B8A6', bgColor: 'bg-teal-50', hoverColor: 'hover:bg-teal-100', textColor: 'text-teal-700' },
    { type: 'eSignature', label: 'e-Signature', icon: Edit3, color: '#EF4444', bgColor: 'bg-red-50', hoverColor: 'hover:bg-red-100', textColor: 'text-red-700' },
    { type: 'smartEditor', label: 'Smart Editor', icon: FileText, color: '#F97316', bgColor: 'bg-orange-50', hoverColor: 'hover:bg-orange-100', textColor: 'text-orange-700' },
    { type: 'bodyMap', label: 'Body Map / Drawing', icon: PenTool, color: '#06B6D4', bgColor: 'bg-cyan-50', hoverColor: 'hover:bg-cyan-100', textColor: 'text-cyan-700' }
  ];
  
  // State to track which question type's subtypes are expanded
  const [expandedType, setExpandedType] = useState<string | null>(null);

  // Toggle expanded state for a question type
  const toggleExpand = (type: string) => {
    setExpandedType(expandedType === type ? null : type);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Question type buttons */}
      <div className="border-b border-gray-200">
        {questionTypes.map((qType) => (
          <div key={qType.type}>
            <button
              onClick={() => toggleExpand(qType.type)}
              className={`w-full text-left question-type-button border-b border-gray-100 ${qType.textColor} ${expandedType === qType.type ? qType.bgColor : ''} text-sm font-medium`}
              style={{
                borderLeft: expandedType === qType.type ? `4px solid ${qType.color}` : '',
                background: expandedType === qType.type ? `linear-gradient(to right, ${qType.color}10, transparent)` : ''
              }}
            >
              <span className="flex items-center">
                {React.createElement(qType.icon, { className: "h-4 w-4 mr-2", style: { color: qType.color } })}
                {qType.label}
              </span>
              {expandedType === qType.type ? 
                <ChevronDown className="h-4 w-4" style={{ color: qType.color }} /> : 
                <ChevronRight className="h-4 w-4" style={{ color: qType.color }} />}
            </button>
            
            {/* Subtypes dropdown when expanded */}
            {expandedType === qType.type && (
              <div className="bg-gray-50">
                {questionSubtypes.map((subtype) => (
                  <div key={`${qType.type}-${subtype.type}`} className="px-2 py-1 border-b border-gray-100 last:border-b-0">
                    <div
                      className={`question-subtype-button ${subtype.hoverColor} text-sm ${subtype.textColor}`}
                      style={{
                        borderLeft: `3px solid ${subtype.color}`
                      }}
                    >
                      <div className="flex items-center w-full">
                        <button
                          onClick={() => {
                            // Set the preview question type and display the form without adding to list
                            onSelectItem(-1, subtype.type);
                          }}
                          className="flex items-center flex-1"
                        >
                          {React.createElement(subtype.icon, { className: "h-4 w-4 mr-2", style: { color: subtype.color } })}
                          <span className="flex-1">{subtype.label}</span>
                        </button>
                        <button
                          onClick={() => onAddItem(subtype.type)}
                          className="flex items-center justify-center h-5 w-5 rounded-full bg-white shadow-sm"
                          style={{ border: `1px solid ${subtype.color}` }}
                          title="Add to list"
                        >
                          <Plus className="h-3 w-3" style={{ color: subtype.color }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  <div className="flex items-center text-xs mt-1">
                  {(() => {
                    // Find the matching question type to get its color and icon
                    const matchType = [...questionTypes, ...questionSubtypes].find(t => 
                      t.type === item.type || 
                      (item.type === 'blank' && t.type === 'openAnswer')
                    );
                    
                    const typeLabel = 
                      item.type === 'demographics' ? 'Demographics' :
                      item.type === 'primaryInsurance' ? 'Primary Insurance' :
                      item.type === 'secondaryInsurance' ? 'Secondary Insurance' :
                      item.type === 'allergies' ? 'Allergies' :
                      item.type === 'mixedControls' ? 'Mixed Controls' :
                      item.type === 'openAnswer' ? 'Open Answer' :
                      item.type === 'blank' ? 'Open Answer' :
                      item.type === 'multipleChoiceSingle' ? 'Multiple Choice - Single Answer' :
                      item.type === 'multipleChoiceMultiple' ? 'Multiple Choice - Multiple Answer' :
                      item.type === 'matrix' ? 'Matrix' :
                      item.type === 'matrixSingleAnswer' ? 'Matrix - Single Answer per Line' :
                      item.type === 'sectionTitle' ? 'Section Title / Note' :
                      item.type === 'fileAttachment' ? 'File Attachment' :
                      item.type === 'eSignature' ? 'e-Signature' :
                      item.type === 'smartEditor' ? 'Smart Editor' :
                      item.type === 'bodyMap' ? 'Body Map / Drawing' :
                      item.type;
                    
                    if (matchType) {
                      return (
                        <>
                          {React.createElement(matchType.icon, { 
                            className: "h-3 w-3 mr-1", 
                            style: { color: matchType.color } 
                          })}
                          <span className={matchType.textColor}>
                            {typeLabel}
                            {item.isRequired && ' (Required)'}
                          </span>
                        </>
                      );
                    }
                    
                    return (
                      <span className="text-gray-500">
                        {typeLabel}
                        {item.isRequired && ' (Required)'}
                      </span>
                    );
                  })()} 
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