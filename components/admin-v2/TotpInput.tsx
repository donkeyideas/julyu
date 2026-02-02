'use client'

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react'

interface TotpInputProps {
  onComplete: (code: string) => void
  disabled?: boolean
  error?: string
  autoFocus?: boolean
}

export default function TotpInput({
  onComplete,
  disabled = false,
  error,
  autoFocus = true,
}: TotpInputProps) {
  const [values, setValues] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)

    const newValues = [...values]
    newValues[index] = digit
    setValues(newValues)

    // Move to next input if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if complete
    const code = newValues.join('')
    if (code.length === 6 && !newValues.includes('')) {
      onComplete(code)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus()
        const newValues = [...values]
        newValues[index - 1] = ''
        setValues(newValues)
      } else {
        // Clear current input
        const newValues = [...values]
        newValues[index] = ''
        setValues(newValues)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    if (pastedData) {
      const newValues = [...values]
      for (let i = 0; i < 6; i++) {
        newValues[i] = pastedData[i] || ''
      }
      setValues(newValues)

      // Focus on the last filled input or the next empty one
      const lastFilledIndex = Math.min(pastedData.length, 5)
      inputRefs.current[lastFilledIndex]?.focus()

      // Check if complete
      if (pastedData.length === 6) {
        onComplete(pastedData)
      }
    }
  }

  const reset = () => {
    setValues(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-12 h-14 text-center text-2xl font-mono font-bold
              border-2 rounded-lg text-gray-900
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
              ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
            `}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      <p className="text-center text-sm text-gray-500">
        Enter the 6-digit code from your authenticator app
      </p>
    </div>
  )
}
