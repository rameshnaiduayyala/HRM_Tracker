import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable Enterprise Confirmation Dialog.
 * Used for deletions, status modifications, or other crucial actions.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-6 pt-2">
        {/* Warning Icon & Message */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${
            variant === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 pt-4 border-t border-white/5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            className="flex-1 py-2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}




