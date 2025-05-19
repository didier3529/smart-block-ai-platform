"use client";

import React, { useEffect, useState } from 'react';
import { X } from "lucide-react"

interface FullPageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function FullPageMenu({ isOpen, onClose, title, children }: FullPageMenuProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      // Delay setting the animated state to create a staggered effect
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // First remove the animation classes
      setIsAnimated(false);
      // Then after animation duration, remove the element from DOM
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 300); // Match this with your animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Handle Escape key to close the menu
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`fixed inset-0 bg-black/95 backdrop-blur-lg z-50 overflow-y-auto transition-opacity duration-300 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="container mx-auto px-4 py-16 md:py-24 relative min-h-screen">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-3 rounded-full bg-[#181830] hover:bg-[#1c1c3a] text-purple-400 transition-colors shadow-lg hover:text-white z-10"
          aria-label="Close menu"
        >
          <X size={28} />
        </button>
        
        <div className={`max-w-[1200px] mx-auto transition-all duration-500 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {title && (
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-10 tracking-tight text-center">
              {title}
            </h2>
          )}
          
          <div className={`transition-all duration-700 delay-150 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 