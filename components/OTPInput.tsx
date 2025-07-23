"use client"

import { useRef, KeyboardEvent } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export default function OTPInput({ value, onChange, length = 6, disabled = false }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Helper to focus next input
  const focusNext = (index: number) => {
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Helper to focus previous input
  const focusPrev = (index: number) => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    
    if (e.key === "Backspace") {
      e.preventDefault();
      if (input.value) {
        // If current input has a value, clear it
        const newValue = value.slice(0, index) + value.slice(index + 1);
        onChange(newValue);
      } else {
        // If current input is empty, go to previous and clear it
        focusPrev(index);
        const newValue = value.slice(0, index - 1) + value.slice(index);
        onChange(newValue);
      }
      return;
    }
  };

  const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newChar = e.target.value.slice(-1);
    const numbersOnly = /^\d*$/;
    
    if (!numbersOnly.test(newChar)) return;

    const newValue = value.slice(0, index) + newChar + value.slice(index + 1);
    onChange(newValue);
    
    if (newChar) {
      focusNext(index);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numbersOnly = pastedText.replace(/[^\d]/g, '').slice(0, length);
    
    if (numbersOnly) {
      onChange(numbersOnly.padEnd(length, ''));
      // Focus last input or first empty input
      const firstEmptyIndex = numbersOnly.length;
      if (firstEmptyIndex < length) {
        inputRefs.current[firstEmptyIndex]?.focus();
      }
    }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleInput(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-12 h-14 text-2xl text-center border-2 rounded-lg focus:border-brand-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed bg-gray-50"
          style={{
            caretColor: 'transparent',
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}
        />
      ))}
    </div>
  );
}
