import React from 'react';

interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  open,
  title = 'Delete Item?',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center animate-fadeIn">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <div className="mb-4 text-gray-600">{description}</div>
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="bg-brand-error hover:bg-brand-error-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="loader inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : null}
            {confirmText}
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
} 