import styles from './DataTable.module.css';
import {FaChevronLeft, FaChevronRight, FaSearch} from "react-icons/fa";
import React, {forwardRef, ReactElement, ReactNode, Ref, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {IoClose} from "react-icons/io5";
import Select from "../forms/Select";
import Button from "../misc/Button";
import TableHead from "./TableHead";
import Spinner from "../misc/Spinner";
import Input from "../forms/Input";

type DataTableProps<T> = {
    id: string;
    columns: Column<T>[];
    data: T[];
    defSortBy?: string;
    defSearchQuery?: string;
    sticky?: boolean;
    loading?: boolean;
    className?: string;
    rowClassName?: (row: T) => string;
    onRowClick?: (event: React.MouseEvent, row: T) => void;
    onRowContext?: (event: React.MouseEvent, row: T) => void;
    onSearchChange?: (query: string) => void;
    onPageChange?: (size: number, page: number) => void;
}

type Column<T> = {
    id: string;
    text: string;
    sortable?: boolean;
    searchable?: boolean;
    render?: (row: T) => ReactNode;
    compare?: (a: T, b: T) => number;
    searchValue?: (row: T) => string;
}

type SortOrder = 'asc' | 'desc';

export type DataTableRef = {
    applyFilter: (query: string) => void;
}

function getRowValue<T>(row: T, colId: string): unknown {
    return (row as Record<string, unknown>)[colId];
}

function DataTableInner<T>(
    {
        id,
        columns,
        data = [],
        defSortBy,
        defSearchQuery,
        sticky = true,
        loading = false,
        className,
        rowClassName,
        onRowClick,
        onRowContext,
        onSearchChange,
        onPageChange,
    }: DataTableProps<T>,
    ref: Ref<DataTableRef>
) {
    const [pageSize, setPageSize] = useState<number>(25);
    const [sortBy, setSortBy] = useState<string | undefined>(defSortBy);
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [searchQuery, setSearchQuery] = useState(defSearchQuery || "");
    const [currentPage, setCurrentPage] = useState(1);

    const tableTopRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onPageChange?.(pageSize, currentPage);
    }, [pageSize, currentPage, onPageChange]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
        onSearchChange?.(query);
    }

    const filteredData = useMemo(() => {
        const normalizeText = (text: unknown) => {
            return String(text || '')
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .trim();
        };

        const normalizedQuery = normalizeText(searchQuery);

        if (!normalizedQuery) return data;

        return data.filter(row => {
            return columns.some(col => {
                if (col.searchable === false) return false;

                const rawValue = col.searchValue
                    ? col.searchValue(row)
                    : getRowValue(row, col.id);

                if (rawValue == null) return false;
                return normalizeText(rawValue).includes(normalizedQuery);
            });
        });
    }, [data, searchQuery, columns]);

    const sortedData = useMemo(() => {
        if (!sortBy) return filteredData;

        const col = columns.find(c => c.id === sortBy);
        if (!col || col.sortable === false) return filteredData;

        return [...filteredData].sort((a, b) => {
            if (col.compare) return col.compare(a, b) * (sortOrder === 'asc' ? 1 : -1);

            const aVal = getRowValue(a, col.id);
            const bVal = getRowValue(b, col.id);

            const aNull = aVal === null || aVal === undefined;
            const bNull = bVal === null || bVal === undefined;
            if (aNull && bNull) return 0;
            if (aNull) return 1;
            if (bNull) return -1;

            if (typeof aVal === "number" && typeof bVal === "number") {
                return (aVal - bVal) * (sortOrder === 'asc' ? 1 : -1);
            }

            const cmp = String(aVal).localeCompare(String(bVal));
            return sortOrder === 'asc' ? cmp : -cmp;
        });
    }, [filteredData, sortBy, sortOrder, columns]);

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    const handleSort = (columnId: string) => {
        if (sortBy === columnId) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(columnId);
            setSortOrder('asc');
        }
    }

    useImperativeHandle(ref, () => ({
        applyFilter: (query: string) => setSearchQuery(query),
    }));

    const getRowKey = (row: T, idx: number): string => {
        const r = row as Record<string, unknown>;
        if (r.id !== undefined) return `id_${r.id}`;
        return `idx_${startIndex + idx}`;
    };

    return (
        <div className={`${styles.dataTable} ${className || ''} ${sticky ? styles.sticky : ''}`}>
            <div ref={tableTopRef} className={styles.tableTop}>
                <div className={styles.searchWrapper}>
                    <Input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        icon={searchQuery.length > 0 ? <IoClose/> : <FaSearch/>}
                        iconSettings={{
                            onClick: () => {
                                if (searchQuery.length > 0) handleSearch("");
                            }
                        }}
                    />
                </div>
                <div className={styles.pagination}>
                    <div className={styles.pageSizeContainer}>
                        <span className={styles.pageSizeLabel}>Rows per page:</span>
                        <Select
                            className={styles.pageSizeSelect}
                            value={pageSize}
                            onChange={(size) => setPageSize(Number(size))}
                            options={[
                                {label: "10", value: 10},
                                {label: "25", value: 25},
                                {label: "50", value: 50},
                                {label: "100", value: 100},
                                {label: "200", value: 200},
                                {label: "All", value: 999999},
                            ]}
                        />
                    </div>
                    <div className={styles.paginationControls}>
                        <Button
                            variant={"primary"}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            icon={<FaChevronLeft/>}
                        />
                        <span className={styles.pageInfo}>
                            {currentPage} / {totalPages || 1}
                        </span>
                        <Button
                            variant={"primary"}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            icon={<FaChevronRight/>}
                        />
                    </div>
                </div>
            </div>

            <div ref={tableContainerRef} className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        {columns.map((col) => (
                            <TableHead
                                key={col.id}
                                id={col.id}
                                text={col.text}
                                sortable={col.sortable}
                                sort={sortBy === col.id ? sortOrder : undefined}
                                onSort={handleSort}
                                style={{position: 'sticky', top: 0}}
                            />
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td className={styles.singleCell} colSpan={columns.length}>
                                <Spinner size={"lg"}/>
                            </td>
                        </tr>
                    ) : data.length > 0 ? (
                        paginatedData.map((row, idx) => {
                            const rowKey = getRowKey(row, idx);
                            const currentClass = rowClassName ? rowClassName(row) : undefined;

                            return (
                                <tr
                                    key={rowKey}
                                    className={currentClass}
                                    onClick={(e) => onRowClick?.(e, row)}
                                    onContextMenu={(e) => onRowContext?.(e, row)}
                                >
                                    {columns.map((col) => (
                                        <td key={`${rowKey}_${col.id}`}>
                                            {col.render
                                                ? col.render(row)
                                                : (getRowValue(row, col.id) as ReactNode)
                                            }
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td className={styles.singleCell} colSpan={columns.length}>
                                No data available
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const DataTable = forwardRef(DataTableInner) as <T>(
    props: DataTableProps<T> & { ref?: Ref<DataTableRef> }
) => ReactElement;

export default DataTable;