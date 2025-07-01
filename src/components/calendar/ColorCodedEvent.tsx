import React from 'react';
import { Link } from 'react-router-dom';

interface ColorCodedEventProps {
  appointment: {
    _id: string;
    patient: {
      _id: string;
      firstName: string;
      lastName: string;
      colorCode?: string;
    };
    date: string;
    time: {
      start: string;
      end: string;
    };
    type: string;
    status: string;
  };
  isSelected?: boolean;
}

const ColorCodedEvent: React.FC<ColorCodedEventProps> = ({ appointment, isSelected }) => {
  // Default color if patient doesn't have a color code
  const defaultColor = '#ffffff';
  
  // Get the patient's color code or use default
  const colorCode = appointment.patient?.colorCode || defaultColor;
  
  // Determine text color based on background color brightness
  const getBrightness = (hexColor: string): number => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate brightness (perceived luminance)
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  
  const brightness = getBrightness(colorCode);
  const textColor = brightness > 128 ? '#000000' : '#ffffff';
  
  // Format time for display
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return (
    <Link 
      to={`/appointments/${appointment._id}`}
      className={`block rounded-md p-2 mb-1 transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: colorCode,
        color: textColor,
        borderLeft: `4px solid ${colorCode}`,
      }}
    >
      <div className="font-medium">
        {appointment.patient?.firstName} {appointment.patient?.lastName}
      </div>
      <div className="text-xs">
        {formatTime(appointment.time.start)} - {formatTime(appointment.time.end)}
      </div>
      <div className="text-xs capitalize">
        {appointment.type}
      </div>
    </Link>
  );
};

export default ColorCodedEvent;