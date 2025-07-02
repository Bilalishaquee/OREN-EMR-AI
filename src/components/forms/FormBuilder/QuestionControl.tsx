import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuestionControlProps {
  icon: LucideIcon;
  label: string;
  color: string;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const QuestionControl: React.FC<QuestionControlProps> = ({
  icon: Icon,
  label,
  color,
  isSelected = false,
  onClick,
  disabled = false
}) => {
  // Generate lighter and darker shades of the color
  const getBackgroundColor = () => {
    if (disabled) return '#f3f4f6';
    if (isSelected) return `${color}20`; // 20% opacity
    return 'white';
  };

  const getBorderColor = () => {
    if (disabled) return '#d1d5db';
    if (isSelected) return color;
    return '#e5e7eb';
  };

  const getTextColor = () => {
    if (disabled) return '#9ca3af';
    return isSelected ? color : '#374151';
  };

  return (
    <div
      className={`
        flex items-center p-2.5 rounded-md transition-all duration-200 ease-in-out
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
        ${isSelected ? 'shadow-sm' : ''}
      `}
      style={{
        backgroundColor: getBackgroundColor(),
        borderLeft: `3px solid ${getBorderColor()}`,
        borderTop: '1px solid #f3f4f6',
        borderRight: '1px solid #f3f4f6',
        borderBottom: '1px solid #f3f4f6',
      }}
      onClick={disabled ? undefined : onClick}
    >
      <Icon className="h-4 w-4 mr-2" style={{ color: getTextColor() }} />
      <span className="text-sm font-medium" style={{ color: getTextColor() }}>
        {label}
      </span>
    </div>
  );
};

export default QuestionControl;