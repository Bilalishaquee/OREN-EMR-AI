import React from 'react';
import { Plus, Trash } from 'lucide-react';

interface MatrixSingleAnswerQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    rows?: string[];
    columns?: string[];
  };
  onChange: (updatedItem: any) => void;
}

const MatrixSingleAnswerQuestionEditor: React.FC<MatrixSingleAnswerQuestionProps> = ({ item, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const addRow = () => {
    const newRows = [...(item.rows || []), `Row ${(item.rows?.length || 0) + 1}`];
    onChange({
      ...item,
      rows: newRows
    });
  };

  const updateRow = (index: number, value: string) => {
    if (!item.rows) return;
    
    const updatedRows = [...item.rows];
    updatedRows[index] = value;
    
    onChange({
      ...item,
      rows: updatedRows
    });
  };

  const removeRow = (index: number) => {
    if (!item.rows) return;
    
    const updatedRows = item.rows.filter((_, i) => i !== index);
    
    onChange({
      ...item,
      rows: updatedRows
    });
  };

  const addColumn = () => {
    const newColumns = [...(item.columns || []), `Column ${(item.columns?.length || 0) + 1}`];
    onChange({
      ...item,
      columns: newColumns
    });
  };

  const updateColumn = (index: number, value: string) => {
    if (!item.columns) return;
    
    const updatedColumns = [...item.columns];
    updatedColumns[index] = value;
    
    onChange({
      ...item,
      columns: updatedColumns
    });
  };

  const removeColumn = (index: number) => {
    if (!item.columns) return;
    
    const updatedColumns = item.columns.filter((_, i) => i !== index);
    
    onChange({
      ...item,
      columns: updatedColumns
    });
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Matrix - Single Answer per Line</h2>
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Rows</h3>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </button>
        </div>
        
        {item.rows && item.rows.length > 0 ? (
          <div className="space-y-3">
            {item.rows.map((row, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="text"
                  value={row}
                  onChange={(e) => updateRow(index, e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder={`Row ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
            No rows added yet. Click "Add Row" to add your first row.
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-gray-900">Columns</h3>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </button>
        </div>
        
        {item.columns && item.columns.length > 0 ? (
          <div className="space-y-3">
            {item.columns.map((column, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="text"
                  value={column}
                  onChange={(e) => updateColumn(index, e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder={`Column ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeColumn(index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
            No columns added yet. Click "Add Column" to add your first column.
          </p>
        )}
      </div>

      {item.rows && item.rows.length > 0 && item.columns && item.columns.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                  {item.columns.map((column, index) => (
                    <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {item.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row}
                    </td>
                    {item.columns.map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex justify-center">
                          <div className="h-5 w-5 border border-gray-300 rounded-full"></div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrixSingleAnswerQuestionEditor;