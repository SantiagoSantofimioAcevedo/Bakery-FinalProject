import React, { ReactNode } from 'react';

interface TableColumn<T> {
  header: string;
  accessor: ((item: T, index: number) => ReactNode) | keyof T;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

function Table<T extends Record<keyof T, any>>({
  columns,
  data,
  emptyMessage = 'No hay datos disponibles',
  className = '',
}: TableProps<T>) {
  const getCellValue = (item: T, column: TableColumn<T>, index: number): ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item, index);
    }
    
    // Convertir explícitamente el valor a ReactNode
    const value = item[column.accessor as keyof T];
    return (value === null || value === undefined) ? '' : String(value);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((column, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                    {getCellValue(item, column, rowIdx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;