"use client";

import React from 'react';

interface SimpleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function SimpleDialog({ isOpen, onClose, title, children }: SimpleDialogProps) {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
} 