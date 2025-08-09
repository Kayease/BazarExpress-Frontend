import React from 'react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  itemName?: string;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  itemName = 'items'
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const maxVisiblePages = 5;
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination logic
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      const adjustedStart = Math.max(1, endPage - maxVisiblePages + 1);
      
      for (let i = adjustedStart; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and first/last page if needed
      if (adjustedStart > 1) {
        pages.unshift('...');
        pages.unshift(1);
      }
      if (endPage < totalPages) {
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-white">
      <p className="text-sm text-gray-600">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {itemName}
      </p>
      <div className="flex items-center space-x-2">
        <button
          className="px-3 py-1 rounded border text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-gray-500">...</span>
          ) : (
            <button
              key={page}
              className={`px-3 py-1 rounded text-sm font-medium border transition-colors ${
                currentPage === page 
                  ? 'bg-brand-primary text-white border-brand-primary' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </button>
          )
        ))}
        <button
          className="px-3 py-1 rounded border text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}