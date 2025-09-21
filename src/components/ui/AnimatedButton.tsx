'use client'

import { forwardRef, ButtonHTMLAttributes, useState } from 'react'
import { motion } from 'framer-motion'
import { useSound } from '@/hooks/useSound'

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  gradient?: boolean
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      gradient = false,
      className = '',
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isClicked, setIsClicked] = useState(false)
    const { playClick, playHover } = useSound()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return

      // Play sound effect
      playClick()

      // Ripple effect
      setIsClicked(true)
      setTimeout(() => setIsClicked(false), 600)

      onClick?.(e)
    }

    const handleMouseEnter = () => {
      if (!disabled && !loading) {
        playHover()
      }
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-7 py-3.5 text-lg',
    }

    const baseClasses = `
      relative overflow-hidden font-semibold rounded-lg
      transition-all duration-300 transform-gpu
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${sizeClasses[size]}
    `

    const variantClasses = {
      primary: gradient
        ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white hover:shadow-xl hover:shadow-purple-500/25'
        : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
      secondary: 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 focus:ring-gray-500',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    }

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        {...props}
      >
        {/* Shimmer effect for gradient buttons */}
        {gradient && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: '-200%' }}
            animate={{ x: '-200%' }}
            whileHover={{ x: '200%' }}
            transition={{ duration: 1 }}
          />
        )}

        {/* Ripple Effect */}
        {isClicked && (
          <motion.span
            className="absolute inset-0 rounded-lg bg-white/30"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}

        {/* Loading Spinner */}
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}

        {/* Button Content */}
        <motion.span
          className="relative z-10 flex items-center justify-center gap-2"
          animate={{ opacity: loading ? 0 : 1 }}
        >
          {icon && iconPosition === 'left' && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {icon}
            </motion.span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <motion.span
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {icon}
            </motion.span>
          )}
        </motion.span>

        {/* Hover Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ 
            opacity: variant === 'primary' && !disabled && !loading ? 0.2 : 0,
            boxShadow: '0 0 20px currentColor'
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

export default AnimatedButton