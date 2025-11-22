import React from 'react';

interface BodyMapQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    bodyMapType?: 'full' | 'front' | 'back' | 'head' | 'hand' | 'foot';
    allowPatientMarkings?: boolean;
  };
  onChange: (updatedItem: any) => void;
}

const BodyMapQuestionEditor: React.FC<BodyMapQuestionProps> = ({ item, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onChange({
        ...item,
        [name]: checked
      });
    } else {
      onChange({
        ...item,
        [name]: value
      });
    }
  };
  
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-emerald-500">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-emerald-100 p-2 rounded-md mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Body Map / Drawing</h2>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="questionText" className="block text-sm font-medium text-gray-700">
            Question
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRequired"
              name="isRequired"
              checked={item.isRequired}
              onChange={handleChange}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-colors duration-200"
            />
            <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900">
              Is Required
            </label>
          </div>
        </div>
        <textarea
          id="questionText"
          name="questionText"
          value={item.questionText}
          onChange={handleChange}
          rows={3}
          className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Type your question text here"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="bodyMapType" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <span className="bg-emerald-100 p-1 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </span>
          Body Map Type
        </label>
        <select
          id="bodyMapType"
          name="bodyMapType"
          value={item.bodyMapType || 'full'}
          onChange={handleChange}
          className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
        >
          <option value="full">Full Body (Front & Back)</option>
          <option value="front">Body Front</option>
          <option value="back">Body Back</option>
          <option value="head">Head</option>
          <option value="hand">Hand</option>
          <option value="foot">Foot</option>
        </select>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center bg-gray-50 p-3 rounded-md hover:bg-emerald-50 transition-colors duration-200">
          <input
            type="checkbox"
            id="allowPatientMarkings"
            name="allowPatientMarkings"
            checked={item.allowPatientMarkings !== false}
            onChange={handleChange}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-colors duration-200"
          />
          <label htmlFor="allowPatientMarkings" className="ml-2 block text-sm text-gray-900">
            Allow patient to mark areas on the body map
          </label>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <span className="bg-emerald-100 p-1 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </span>
          Preview
        </h3>
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 hover:shadow-md transition-all duration-200">
          <p className="text-sm text-gray-900 mb-2 font-medium">{item.questionText || 'Please mark areas on the body map'}</p>
          <div className="flex justify-center p-4 bg-white rounded-md border border-emerald-100">
            {renderBodyMapPreview(item.bodyMapType || 'full')}
          </div>
          {item.allowPatientMarkings !== false && (
            <div className="mt-2 flex justify-center space-x-2">
              <button className="px-3 py-1 text-xs rounded-md bg-red-100 text-red-800 hover:bg-red-200 transition-colors duration-200 shadow-sm">Pain</button>
              <button className="px-3 py-1 text-xs rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 shadow-sm">Numbness</button>
              <button className="px-3 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors duration-200 shadow-sm">Tingling</button>
              <button className="px-3 py-1 text-xs rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors duration-200 shadow-sm">Erase</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const renderBodyMapPreview = (type: string) => {
  // Simplified body map representations
  switch (type) {
    case 'full':
      return (
        <div className="flex space-x-4">
          <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-xs text-gray-500">Front View</span>
          </div>
          <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-xs text-gray-500">Back View</span>
          </div>
        </div>
      );
    case 'front':
      return (
        <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Front View</span>
        </div>
      );
    case 'back':
      return (
        <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Back View</span>
        </div>
      );
    case 'head':
      return (
        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-500">Head</span>
        </div>
      );
    case 'hand':
      return (
        <div className="w-32 h-40 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Hand</span>
        </div>
      );
    case 'foot':
      return (
        <div className="w-32 h-40 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Foot</span>
        </div>
      );
    default:
      return (
        <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Body Map</span>
        </div>
      );
  }
};

export default BodyMapQuestionEditor;