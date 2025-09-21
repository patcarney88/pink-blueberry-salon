'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, CameraOff, Download, Share2, Sparkles, Palette } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedButton from '@/components/ui/AnimatedButton'

interface Style {
  id: string
  name: string
  category: 'hair' | 'makeup' | 'nails'
  preview: string
  filter: string
}

const styles: Style[] = [
  // Hair Styles
  { id: 'h1', name: 'Sunset Ombre', category: 'hair', preview: '🌅', filter: 'hue-rotate(30deg) saturate(1.5)' },
  { id: 'h2', name: 'Platinum Blonde', category: 'hair', preview: '✨', filter: 'brightness(1.3) contrast(0.9)' },
  { id: 'h3', name: 'Rose Gold', category: 'hair', preview: '🌹', filter: 'sepia(0.3) hue-rotate(330deg) saturate(1.2)' },
  { id: 'h4', name: 'Mermaid Blue', category: 'hair', preview: '🧜‍♀️', filter: 'hue-rotate(180deg) saturate(1.3)' },
  { id: 'h5', name: 'Purple Haze', category: 'hair', preview: '💜', filter: 'hue-rotate(270deg) saturate(1.4)' },
  { id: 'h6', name: 'Copper Red', category: 'hair', preview: '🦊', filter: 'sepia(0.5) hue-rotate(350deg) saturate(2)' },
  
  // Makeup Looks
  { id: 'm1', name: 'Natural Glow', category: 'makeup', preview: '✨', filter: 'brightness(1.1) blur(0.5px)' },
  { id: 'm2', name: 'Bold Glam', category: 'makeup', preview: '💋', filter: 'contrast(1.2) saturate(1.3)' },
  { id: 'm3', name: 'Soft Pink', category: 'makeup', preview: '🌸', filter: 'hue-rotate(330deg) brightness(1.1)' },
  { id: 'm4', name: 'Smokey Eye', category: 'makeup', preview: '🔥', filter: 'contrast(1.3) brightness(0.95)' },
  { id: 'm5', name: 'Golden Hour', category: 'makeup', preview: '🌟', filter: 'sepia(0.2) brightness(1.15)' },
  
  // Nail Designs
  { id: 'n1', name: 'French Tips', category: 'nails', preview: '💅', filter: 'brightness(1.2)' },
  { id: 'n2', name: 'Galaxy Nails', category: 'nails', preview: '🌌', filter: 'hue-rotate(240deg) contrast(1.2)' },
  { id: 'n3', name: 'Chrome Finish', category: 'nails', preview: '✨', filter: 'contrast(1.5) brightness(1.1)' },
]

export default function VirtualTryOn() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null)
  const [activeCategory, setActiveCategory] = useState<'hair' | 'makeup' | 'nails'>('hair')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isCameraOn && videoRef.current && !streamRef.current) {
      startCamera()
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isCameraOn])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      console.error('Camera access denied:', err)
      setIsCameraOn(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOn(false)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const imageData = canvasRef.current.toDataURL('image/png')
        setCapturedImage(imageData)
      }
    }
  }

  const downloadImage = () => {
    if (capturedImage) {
      const link = document.createElement('a')
      link.download = `virtual-tryon-${Date.now()}.png`
      link.href = capturedImage
      link.click()
    }
  }

  const shareImage = async () => {
    if (capturedImage && navigator.share) {
      try {
        const blob = await (await fetch(capturedImage)).blob()
        const file = new File([blob], 'virtual-tryon.png', { type: 'image/png' })
        await navigator.share({
          title: 'My New Look from Pink Blueberry Salon',
          text: 'Check out my virtual try-on!',
          files: [file]
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    }
  }

  const filteredStyles = styles.filter(style => style.category === activeCategory)

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 right-6 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
      >
        <Camera className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          AR
        </span>
      </motion.button>

      {/* AR Try-On Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  AR Virtual Try-On
                </h2>
                <p className="text-purple-100 mt-1">Try different styles virtually!</p>
              </div>

              <div className="p-6">
                {/* Category Tabs */}
                <div className="flex gap-2 mb-6">
                  {(['hair', 'makeup', 'nails'] as const).map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                        activeCategory === category
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Camera View */}
                  <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden aspect-[4/3]">
                    {!isCameraOn && !capturedImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <CameraOff className="w-12 h-12 text-gray-400 mb-4" />
                        <AnimatedButton
                          onClick={() => setIsCameraOn(true)}
                          variant="primary"
                          gradient
                          icon={<Camera className="w-5 h-5" />}
                        >
                          Start Camera
                        </AnimatedButton>
                      </div>
                    )}

                    {isCameraOn && (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{
                            filter: selectedStyle?.filter || 'none',
                            transform: 'scaleX(-1)'
                          }}
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          <AnimatedButton
                            onClick={captureImage}
                            size="sm"
                            variant="primary"
                            gradient
                          >
                            Capture
                          </AnimatedButton>
                          <AnimatedButton
                            onClick={stopCamera}
                            size="sm"
                            variant="secondary"
                          >
                            Stop
                          </AnimatedButton>
                        </div>
                      </>
                    )}

                    {capturedImage && (
                      <>
                        <img
                          src={capturedImage}
                          alt="Captured"
                          className="w-full h-full object-cover"
                          style={{
                            filter: selectedStyle?.filter || 'none',
                            transform: 'scaleX(-1)'
                          }}
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          <AnimatedButton
                            onClick={() => {
                              setCapturedImage(null)
                              setIsCameraOn(true)
                            }}
                            size="sm"
                            variant="secondary"
                          >
                            Retake
                          </AnimatedButton>
                          <AnimatedButton
                            onClick={downloadImage}
                            size="sm"
                            variant="primary"
                            icon={<Download className="w-4 h-4" />}
                          >
                            Save
                          </AnimatedButton>
                          {navigator.share && (
                            <AnimatedButton
                              onClick={shareImage}
                              size="sm"
                              variant="primary"
                              icon={<Share2 className="w-4 h-4" />}
                            >
                              Share
                            </AnimatedButton>
                          )}
                        </div>
                      </>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Style Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-600" />
                      Choose a Style
                    </h3>
                    <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                      {filteredStyles.map(style => (
                        <motion.button
                          key={style.id}
                          onClick={() => setSelectedStyle(style)}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            selectedStyle?.id === style.id
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-3xl mb-2">{style.preview}</div>
                          <div className="text-xs font-medium">{style.name}</div>
                        </motion.button>
                      ))}
                    </div>

                    {selectedStyle && (
                      <motion.div
                        className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                          Selected: {selectedStyle.name}
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          Tap capture to save your new look!
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <div className="mt-6 text-center">
                  <AnimatedButton
                    onClick={() => {
                      setIsOpen(false)
                      stopCamera()
                      setCapturedImage(null)
                    }}
                    variant="ghost"
                  >
                    Close
                  </AnimatedButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}