'use client'

import { useState, forwardRef, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'

interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  icon?: React.ReactNode
}

const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, success, helperText, icon, className = '', ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const [hasValue, setHasValue] = useState(false)

    const handleFocus = () => setFocused(true)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      setHasValue(e.target.value !== '')
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== '')
      props.onChange?.(e)
    }

    return (
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <motion.label
            className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
              focused || hasValue || props.value
                ? '-top-2.5 text-xs bg-white dark:bg-gray-900 px-1'
                : 'top-3 text-base'
            } ${
              error
                ? 'text-red-500'
                : success
                ? 'text-green-500'
                : focused
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            animate={{
              y: focused || hasValue || props.value ? -8 : 0,
              scale: focused || hasValue || props.value ? 0.85 : 1,
            }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}

          <motion.input
            ref={ref}
            className={`w-full px-3 ${icon ? 'pl-10' : ''} py-3 border rounded-lg outline-none transition-all duration-200 bg-white dark:bg-gray-900 ${
              error
                ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
                : success
                ? 'border-green-500 focus:border-green-600 focus:ring-2 focus:ring-green-500/20'
                : 'border-gray-300 dark:border-gray-700 focus:border-purple-600 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20'
            } ${className}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            whileFocus={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            {...props}
          />

          {/* Status Icons */}
          <motion.div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: error || success ? 1 : 0,
              scale: error || success ? 1 : 0
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {error && <X className="w-5 h-5 text-red-500" />}
            {success && <Check className="w-5 h-5 text-green-500" />}
          </motion.div>
        </div>

        {/* Helper Text / Error Message */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: error || helperText ? 1 : 0,
            height: error || helperText ? 'auto' : 0
          }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <p className={`mt-1 text-sm flex items-center gap-1 ${
            error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {error && <AlertCircle className="w-3 h-3" />}
            {error || helperText}
          </p>
        </motion.div>

        {/* Focus Ring Animation */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: focused ? 1 : 0,
            boxShadow: focused 
              ? '0 0 0 3px rgba(147, 51, 234, 0.1)' 
              : '0 0 0 0px rgba(147, 51, 234, 0)'
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

export default AnimatedInput