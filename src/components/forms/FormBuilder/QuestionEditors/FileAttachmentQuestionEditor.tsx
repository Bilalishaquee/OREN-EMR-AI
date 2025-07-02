import React from 'react';

interface FileAttachmentQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    fileTypes?: string[];
    maxFileSize?: number;
  };
  onChange: (updatedItem: any) => void;
}

const FileAttachmentQuestionEditor: React.FC<FileAttachmentQuestionProps> = ({ item, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onChange({
        ...item,
        [name]: checked
      });
    } else if (name === 'maxFileSize') {
      onChange({
        ...item,
        [name]: parseInt(value) || 0
      });
    } else {
      onChange({
        ...item,
        [name]: value
      });
    }
  };

  const handleFileTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const currentFileTypes = item.fileTypes || [];
    
    if (checked) {
      onChange({
        ...item,
        fileTypes: [...currentFileTypes, value]
      });
    } else {
      onChange({
        ...item,
        fileTypes: currentFileTypes.filter(type => type !== value)
      });
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">File Attachment</h2>
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Type your question text here"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700 mb-1">
          Maximum File Size (MB)
        </label>
        <input
          type="number"
          id="maxFileSize"
          name="maxFileSize"
          value={item.maxFileSize || 10}
          onChange={handleChange}
          min="1"
          max="100"
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allowed File Types
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fileType-pdf"
              value="pdf"
              checked={item.fileTypes?.includes('pdf')}
              onChange={handleFileTypeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fileType-pdf" className="ml-2 block text-sm text-gray-900">
              PDF (.pdf)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fileType-doc"
              value="doc"
              checked={item.fileTypes?.includes('doc')}
              onChange={handleFileTypeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fileType-doc" className="ml-2 block text-sm text-gray-900">
              Word (.doc, .docx)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fileType-image"
              value="image"
              checked={item.fileTypes?.includes('image')}
              onChange={handleFileTypeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fileType-image" className="ml-2 block text-sm text-gray-900">
              Images (.jpg, .png, .gif)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fileType-xls"
              value="xls"
              checked={item.fileTypes?.includes('xls')}
              onChange={handleFileTypeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fileType-xls" className="ml-2 block text-sm text-gray-900">
              Excel (.xls, .xlsx)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fileType-txt"
              value="txt"
              checked={item.fileTypes?.includes('txt')}
              onChange={handleFileTypeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fileType-txt" className="ml-2 block text-sm text-gray-900">
              Text (.txt)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fileType-all"
              value="all"
              checked={item.fileTypes?.includes('all')}
              onChange={handleFileTypeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fileType-all" className="ml-2 block text-sm text-gray-900">
              All Files
            </label>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Preview</h3>
        <div className="border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-900 mb-2">{item.questionText || 'Upload your file'}</p>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-7">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="pt-1 text-sm text-gray-600">Drag and drop a file or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.fileTypes && item.fileTypes.length > 0 ? 
                    (item.fileTypes.includes('all') ? 'All file types allowed' : `Allowed: ${item.fileTypes.join(', ')}`) : 
                    'No file types specified'}
                </p>
                <p className="text-xs text-gray-500">
                  Max size: {item.maxFileSize || 10}MB
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileAttachmentQuestionEditor;