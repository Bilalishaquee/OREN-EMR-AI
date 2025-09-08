import React from 'react';
import { Plus, Trash } from 'lucide-react';

type ColType = 'text' | 'checkbox' | 'radio' | 'dropdown';

interface MatrixQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    matrix?: {
      rowHeader?: string;
      columnHeaders: string[];
      columnTypes: ColType[];
      rows: string[];
      dropdownOptions: string[][];
      displayTextBox: boolean;
      allowMultipleAnswers: boolean;
    };
  };
  onChange: (updatedItem: any) => void;
}

const MatrixQuestionEditor: React.FC<MatrixQuestionProps> = ({ item, onChange }) => {
  const matrix = item.matrix || {
    rowHeader: 'Questions',
    columnHeaders: ['Option 1', 'Option 2', 'Option 3'],
    columnTypes: ['text', 'text', 'text'] as ColType[],
    rows: ['Row 1', 'Row 2', 'Row 3'],
    dropdownOptions: [[], [], []],
    displayTextBox: false,
    allowMultipleAnswers: true
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onChange({ ...item, [name]: checked, matrix: { ...matrix } });
    } else {
      onChange({ ...item, [name]: value, matrix: { ...matrix } });
    }
  };

  const updateMatrix = (updates: Partial<typeof matrix>) => {
    onChange({ ...item, matrix: { ...matrix, ...updates } });
  };

  const addRow = () => {
    updateMatrix({ rows: [...matrix.rows, `Row ${matrix.rows.length + 1}`] });
  };

  const updateRow = (index: number, value: string) => {
    const updatedRows = [...matrix.rows];
    updatedRows[index] = value;
    updateMatrix({ rows: updatedRows });
  };

  const removeRow = (index: number) => {
    const updatedRows = matrix.rows.filter((_, i) => i !== index);
    updateMatrix({ rows: updatedRows });
  };

  // CHANGE #2: default new column type is 'text'
  const addColumn = () => {
    updateMatrix({
      columnHeaders: [...matrix.columnHeaders, `Column ${matrix.columnHeaders.length + 1}`],
      columnTypes: [...matrix.columnTypes, 'text'],
      dropdownOptions: [...matrix.dropdownOptions, []]
    });
  };

  const updateColumn = (index: number, value: string) => {
    const updatedColumnHeaders = [...matrix.columnHeaders];
    updatedColumnHeaders[index] = value;
    updateMatrix({ columnHeaders: updatedColumnHeaders });
  };

  // NEW: update column type
  const updateColumnType = (index: number, value: ColType) => {
    const updatedColumnTypes = [...matrix.columnTypes];
    updatedColumnTypes[index] = value;
    updateMatrix({ columnTypes: updatedColumnTypes });
  };

  const removeColumn = (index: number) => {
    const updatedColumnHeaders = matrix.columnHeaders.filter((_, i) => i !== index);
    const updatedColumnTypes = matrix.columnTypes.filter((_, i) => i !== index);
    const updatedDropdownOptions = matrix.dropdownOptions.filter((_, i) => i !== index);
    updateMatrix({
      columnHeaders: updatedColumnHeaders,
      columnTypes: updatedColumnTypes,
      dropdownOptions: updatedDropdownOptions
    });
  };

  // Helper to decide the effective type for a column
  const getColType = (colIdx: number): ColType => {
    const t = matrix.columnTypes?.[colIdx];
    if (t) return t;
    // fallback: preserve your old multi/single behavior only if type missing
    return matrix.allowMultipleAnswers ? 'checkbox' : 'radio';
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-md mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Matrix Question</h2>
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
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
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
          placeholder="Type your question text here"
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center bg-blue-50 p-2 rounded-md hover:bg-blue-100 transition-colors duration-200">
          <input
            type="checkbox"
            id="allowMultipleAnswers"
            name="allowMultipleAnswers"
            checked={matrix.allowMultipleAnswers}
            onChange={(e) => updateMatrix({ allowMultipleAnswers: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
          />
          <label htmlFor="allowMultipleAnswers" className="ml-2 block text-sm text-gray-900">
            Allow multiple answers per row
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Rows */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 p-1 rounded-md mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
              </svg>
            </span>
            Rows
          </h3>
          <div className="space-y-3">
            {matrix.rows.length > 0 ? (
              matrix.rows.map((row, index) => (
                <div key={index} className="flex items-center bg-white p-2 rounded-md hover:bg-blue-50 transition-colors duration-200">
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => updateRow(index, e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
                    placeholder={`Row ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
                No rows added yet. Click "Add Row" to add your first row.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </button>
        </div>

        {/* Columns */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 p-1 rounded-md mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </span>
            Columns
          </h3>
          <div className="space-y-3">
            {matrix.columnHeaders.length > 0 ? (
              matrix.columnHeaders.map((column, index) => (
                <div key={index} className="flex items-center bg-white p-2 rounded-md hover:bg-blue-50 transition-colors duration-200 space-x-2">
                  <input
                    type="text"
                    value={column}
                    onChange={(e) => updateColumn(index, e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-200"
                    placeholder={`Column ${index + 1}`}
                  />
                  {/* CHANGE #3: Type selector */}
                  <select
                    value={getColType(index)}
                    onChange={(e) => updateColumnType(index, e.target.value as ColType)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    title="Column input type"
                  >
                    <option value="text">Text</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="radio">Radio</option>
                    <option value="dropdown">Dropdown</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => removeColumn(index)}
                    className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
                No columns added yet. Click "Add Column" to add your first column.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={addColumn}
            className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </button>
        </div>
      </div>

      {/* CHANGE #1: Preview uses columnTypes */}
      {matrix.rows.length > 0 && matrix.columnHeaders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 p-1 rounded-md mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            Preview
          </h3>
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50 hover:shadow-md transition-all duration-200">
            <p className="text-sm text-gray-900 mb-4 font-medium">{item.questionText || 'Your question here'}</p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                <thead className="bg-blue-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      {matrix.rowHeader || ''}
                    </th>
                    {matrix.columnHeaders.map((column, index) => (
                      <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {matrix.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                        {row}
                      </td>
                      {matrix.columnHeaders.map((_, colIndex) => {
                        const colType = getColType(colIndex);
                        return (
                          <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200 last:border-r-0 text-center">
                            {colType === 'text' && (
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                placeholder="Text"
                                disabled
                              />
                            )}
                            {colType === 'dropdown' && (
                              <select className="w-full border border-gray-300 rounded px-2 py-1" disabled>
                                {(matrix.dropdownOptions?.[colIndex] ?? []).map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                            {colType === 'checkbox' && <input type="checkbox" disabled />}
                            {colType === 'radio' && <input type="radio" name={`row-${rowIndex}`} disabled />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MatrixQuestionEditor;
