import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Eye, EyeOff, Search } from 'lucide-react';

function DataTable({ data, schema, title = 'Respostas Detalhadas' }) {
  const [columnVisibility, setColumnVisibility] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  // Extract questions from form schema and group by section
  const columns = useMemo(() => {
    if (!schema || !schema.pages) return [];

    const questions = [];
    
    // Add metadata columns (pinned)
    questions.push({
      id: 'metadata',
      header: () => <span className="text-xs font-bold text-brand-950">Data</span>,
      accessorKey: 'createdAt',
      cell: ({ getValue }) => (
        <span className="text-xs font-medium text-brand-950 whitespace-nowrap">
          {new Date(getValue()).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
      size: 120,
      pinned: true,
      section: 'metadata',
    });

    // Extract questions from each page/section
    schema.pages.forEach((page, pageIndex) => {
      const sectionName = page.title || page.name || `Seção ${pageIndex + 1}`;
      
      page.elements.forEach((element) => {
        if (element.type === 'matrix') {
          // Matrix questions (like PHQ-9, GAD-7)
          element.rows?.forEach((row) => {
            questions.push({
              id: `${element.name}_${row.value}`,
              header: () => (
                <span className="text-xs font-medium text-brand-950" title={row.text}>
                  {row.text?.substring(0, 30)}...
                </span>
              ),
              accessorKey: `${element.name}.${row.value}`,
              cell: ({ getValue }) => {
                const value = getValue();
                const columnNames = element.columns;
                const label = columnNames?.find(c => c.value === value)?.text || value || '-';
                return (
                  <span className="text-xs text-brand-700 whitespace-normal max-w-[200px]">
                    {label}
                  </span>
                );
              },
              size: 180,
              section: sectionName,
            });
          });
        } else {
          // Regular questions
          questions.push({
            id: element.name,
            header: () => (
              <span className="text-xs font-medium text-brand-950" title={element.title}>
                {element.title?.substring(0, 30)}...
              </span>
            ),
            accessorKey: element.name,
            cell: ({ getValue }) => {
              const value = getValue();
              if (typeof value === 'object') return <pre className="text-xs text-brand-700">{JSON.stringify(value, null, 2)}</pre>;
              return <span className="text-xs text-brand-700 whitespace-normal max-w-[200px]">{String(value || '-')}</span>;
            },
            size: 180,
            section: sectionName,
          });
        }
      });
    });

    return questions;
  }, [schema]);

  // Group columns by section
  const sections = useMemo(() => {
    const sectionMap = new Map();
    columns.forEach(col => {
      if (!sectionMap.has(col.section)) {
        sectionMap.set(col.section, []);
      }
      sectionMap.get(col.section).push(col);
    });
    return Array.from(sectionMap.entries());
  }, [columns]);

  // Toggle section visibility
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row => {
      return Object.values(row).some(value =>
        JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  // Prepare table columns (only show expanded sections)
  const visibleColumns = useMemo(() => {
    return columns.filter(col => {
      if (col.pinned) return true;
      return expandedSections[col.section] !== false;
    });
  }, [columns, expandedSections]);

  const table = useReactTable({
    data: filteredData,
    columns: visibleColumns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-brand-100 p-12 text-center">
        <p className="text-brand-400">Nenhuma resposta para exibir</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-brand-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-brand-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-brand-950">{title}</h3>
          <span className="text-xs text-brand-400">{filteredData.length} respostas</span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={14} />
          <input
            type="text"
            placeholder="Buscar nas respostas..."
            className="w-full pl-10 pr-4 py-2 text-xs border-2 border-brand-100 rounded-lg focus:border-brand-950 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Section toggles */}
        <div className="flex flex-wrap gap-2">
          {sections.map(([sectionName, cols]) => (
            <button
              key={sectionName}
              onClick={() => toggleSection(sectionName)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                expandedSections[sectionName] !== false
                  ? 'bg-brand-950 text-white'
                  : 'bg-brand-100 text-brand-600 hover:bg-brand-200'
              }`}
            >
              {expandedSections[sectionName] !== false ? (
                <EyeOff size={12} />
              ) : (
                <Eye size={12} />
              )}
              <span className="truncate max-w-[150px]">{sectionName}</span>
              <span className="text-[10px] opacity-75">({cols.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-brand-50">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left border-b-2 border-brand-100 font-bold text-brand-950"
                    style={{
                      minWidth: header.column.columnDef.size,
                      position: header.column.columnDef.pinned ? 'sticky' : undefined,
                      left: header.column.columnDef.pinned ? 0 : undefined,
                      zIndex: header.column.columnDef.pinned ? 20 : 10,
                      backgroundColor: header.column.columnDef.pinned ? 'white' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={`hover:bg-brand-50 transition-colors ${
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-brand-50/30'
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 border-b border-brand-100 align-top"
                    style={{
                      minWidth: cell.column.columnDef.size,
                      position: cell.column.columnDef.pinned ? 'sticky' : undefined,
                      left: cell.column.columnDef.pinned ? 0 : undefined,
                      zIndex: cell.column.columnDef.pinned ? 15 : undefined,
                      backgroundColor: cell.column.columnDef.pinned
                        ? (rowIndex % 2 === 0 ? 'white' : 'rgb(250 250 250 / 0.3)')
                        : undefined,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
