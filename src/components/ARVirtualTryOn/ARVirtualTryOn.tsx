'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CameraIcon,
  SparklesIcon,
  ArrowPathIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface HairStyle {
  id: string
  name: string
  category: string
  image: string
  description: string
  duration: string
  price: string
  trending?: boolean
}

interface HairColor {
  id: string
  name: string
  hex: string
  category: string
  trending?: boolean
}

const hairStyles: HairStyle[] = [
  {
    id: '1',
    name: 'Sleek Bob',
    category: 'Short',
    image: '/styles/bob.jpg',
    description: 'Classic chin-length bob with smooth finish',
    duration: '90 min',
    price: '$85',
    trending: true
  },
  {
    id: '2',
    name: 'Beach Waves',
    category: 'Long',
    image: '/styles/waves.jpg',
    description: 'Effortless beachy waves for a relaxed look',
    duration: '120 min',
    price: '$120'
  },
  {
    id: '3',
    name: 'Pixie Cut',
    category: 'Short',
    image: '/styles/pixie.jpg',
    description: 'Bold and modern pixie cut',
    duration: '75 min',
    price: '$75'
  },
  {
    id: '4',
    name: 'Layered Lob',
    category: 'Medium',
    image: '/styles/lob.jpg',
    description: 'Textured long bob with layers',
    duration: '90 min',
    price: '$95',
    trending: true
  },
  {
    id: '5',
    name: 'Curtain Bangs',
    category: 'Bangs',
    image: '/styles/bangs.jpg',
    description: 'Face-framing curtain bangs',
    duration: '45 min',
    price: '$45'
  }
]

const hairColors: HairColor[] = [
  { id: '1', name: 'Platinum Blonde', hex: '#F8F8FF', category: 'Blonde', trending: true },
  { id: '2', name: 'Honey Blonde', hex: '#F0E68C', category: 'Blonde' },
  { id: '3', name: 'Rose Gold', hex: '#E8B4B8', category: 'Fashion', trending: true },
  { id: '4', name: 'Chocolate Brown', hex: '#5D4037', category: 'Brunette' },
  { id: '5', name: 'Jet Black', hex: '#0A0A0A', category: 'Dark' },
  { id: '6', name: 'Auburn', hex: '#A52A2A', category: 'Red' },
  { id: '7', name: 'Lavender', hex: '#C8B8E8', category: 'Fashion' },
  { id: '8', name: 'Ocean Blue', hex: '#006994', category: 'Fashion' },
  { id: '9', name: 'Cherry Red', hex: '#DC143C', category: 'Red', trending: true },
  { id: '10', name: 'Caramel', hex: '#C68642', category: 'Brunette' }
]

const filterOptions = {
  brightness: { min: 0.5, max: 1.5, default: 1, step: 0.1 },
  contrast: { min: 0.5, max: 1.5, default: 1, step: 0.1 },
  saturation: { min: 0, max: 2, default: 1, step: 0.1 },
  opacity: { min: 0.3, max: 1, default: 0.85, step: 0.05 }
}

export default function ARVirtualTryOn() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<HairStyle | null>(null)
  const [selectedColor, setSelectedColor] = useState<HairColor | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
    opacity: 0.85
  })
  const [beforeAfter, setBeforeAfter] = useState(false)
  const [styleCategory, setStyleCategory] = useState('All')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Error accessing camera:', err)
      }
    }

    if (!capturedImage) {
      initCamera()
    }

    return () => {
      // Cleanup camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [capturedImage])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/png')
        setCapturedImage(imageData)
      }
    }
  }, [])

  const resetCapture = () => {
    setCapturedImage(null)
    setSelectedStyle(null)
    setSelectedColor(null)
    setBeforeAfter(false)
  }

  const toggleFavorite = (styleId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(styleId)) {
      newFavorites.delete(styleId)
    } else {
      newFavorites.add(styleId)
    }
    setFavorites(newFavorites)
  }

  const shareResult = async () => {
    if (navigator.share && capturedImage) {
      try {
        await navigator.share({
          title: 'My New Look - The Pink Blueberry',
          text: `Check out my virtual makeover at The Pink Blueberry Salon! Style: ${selectedStyle?.name || 'Custom'}, Color: ${selectedColor?.name || 'Natural'}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    }
  }

  const saveToGallery = () => {
    if (capturedImage) {
      const link = document.createElement('a')
      link.download = `pink-blueberry-makeover-${Date.now()}.png`
      link.href = capturedImage
      link.click()
    }
  }

  const filterStyle = {
    filter: `brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturation})`,
    opacity: filters.opacity
  }

  const categories = ['All', 'Short', 'Medium', 'Long', 'Bangs']

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
            AR Virtual Try-On Studio
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Try new hairstyles and colors instantly with our advanced AR technology.
            See how you'll look before you book!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Camera/Preview Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {!capturedImage ? (
                <div className="relative aspect-[4/3]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Camera Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsCapturing(true)
                        setTimeout(() => {
                          capturePhoto()
                          setIsCapturing(false)
                        }, 3000)
                      }}
                      disabled={isCapturing}
                      className="mx-auto flex items-center gap-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg"
                    >
                      {isCapturing ? (
                        <>
                          <ArrowPathIcon className="w-6 h-6 animate-spin" />
                          <span className="animate-pulse">Capturing...</span>
                        </>
                      ) : (
                        <>
                          <CameraIcon className="w-6 h-6" />
                          <span>Take Photo</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Countdown Overlay */}
                  <AnimatePresence>
                    {isCapturing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 flex items-center justify-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.5, 1] }}
                          transition={{ duration: 0.5 }}
                          className="text-white text-9xl font-bold"
                        >
                          3
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="relative aspect-[4/3]">
                  {/* Before/After Toggle */}
                  {selectedStyle || selectedColor ? (
                    <div className="absolute top-4 left-4 z-20">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBeforeAfter(!beforeAfter)}
                        className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg font-medium"
                      >
                        {beforeAfter ? 'After' : 'Before'}
                      </motion.button>
                    </div>
                  ) : null}

                  {/* Captured Image */}
                  <img
                    src={capturedImage}
                    alt="Your photo"
                    className="w-full h-full object-cover"
                  />

                  {/* Style/Color Overlay */}
                  {(selectedStyle || selectedColor) && !beforeAfter && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 pointer-events-none"
                      style={filterStyle}
                    >
                      {/* This would be replaced with actual AR overlay */}
                      <div className="w-full h-full bg-gradient-to-br from-transparent via-transparent to-transparent">
                        {selectedColor && (
                          <div
                            className="absolute inset-0 mix-blend-overlay"
                            style={{ backgroundColor: selectedColor.hex, opacity: 0.3 }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Control Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                    <div className="flex justify-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={resetCapture}
                        className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg"
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg"
                      >
                        <AdjustmentsHorizontalIcon className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={saveToGallery}
                        className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg"
                      >
                        <PhotoIcon className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={shareResult}
                        className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg"
                      >
                        <ShareIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && capturedImage && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-50 p-4 border-t"
                  >
                    {Object.entries(filterOptions).map(([key, config]) => (
                      <div key={key} className="mb-3">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {key}: {filters[key as keyof typeof filters].toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          value={filters[key as keyof typeof filters]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [key]: parseFloat(e.target.value)
                          }))}
                          className="w-full mt-1"
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected Style Info */}
            {(selectedStyle || selectedColor) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-white rounded-2xl p-6 shadow-lg"
              >
                <h3 className="font-bold text-lg mb-3">Your Selection</h3>
                {selectedStyle && (
                  <div className="mb-3">
                    <p className="text-gray-600">Style:</p>
                    <p className="font-semibold">{selectedStyle.name}</p>
                    <p className="text-sm text-gray-500">{selectedStyle.description}</p>
                  </div>
                )}
                {selectedColor && (
                  <div className="mb-3">
                    <p className="text-gray-600">Color:</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-200"
                        style={{ backgroundColor: selectedColor.hex }}
                      />
                      <p className="font-semibold">{selectedColor.name}</p>
                    </div>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3 rounded-xl font-semibold shadow-lg mt-4"
                >
                  Book This Look
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Style & Color Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Hair Styles */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Hair Styles</h2>
                <div className="flex gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setStyleCategory(cat)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        styleCategory === cat
                          ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {hairStyles
                  .filter(style => styleCategory === 'All' || style.category === styleCategory)
                  .map((style) => (
                    <motion.div
                      key={style.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedStyle(style)}
                      className={`relative cursor-pointer rounded-xl overflow-hidden shadow-md transition-all ${
                        selectedStyle?.id === style.id
                          ? 'ring-4 ring-pink-500'
                          : 'hover:shadow-lg'
                      }`}
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-pink-100 to-blue-100 relative">
                        {/* Placeholder for style image */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <SparklesIcon className="w-12 h-12 text-pink-300" />
                        </div>
                        {style.trending && (
                          <span className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Trending
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(style.id)
                          }}
                          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full"
                        >
                          {favorites.has(style.id) ? (
                            <HeartSolidIcon className="w-4 h-4 text-pink-500" />
                          ) : (
                            <HeartIcon className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm">{style.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{style.duration}</span>
                          <span className="text-sm font-bold text-pink-500">{style.price}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Hair Colors */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Hair Colors</h2>
              <div className="grid grid-cols-5 gap-3">
                {hairColors.map((color) => (
                  <motion.button
                    key={color.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedColor(color)}
                    className={`relative group ${
                      selectedColor?.id === color.id ? 'ring-4 ring-pink-500 rounded-xl' : ''
                    }`}
                  >
                    <div
                      className="w-full aspect-square rounded-xl shadow-md border-2 border-gray-200 transition-all group-hover:shadow-lg"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.trending && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                        ✨
                      </span>
                    )}
                    <p className="text-xs mt-2 text-center font-medium text-gray-700">
                      {color.name}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-pink-100 to-blue-100 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">AI Recommendations</h3>
              <div className="space-y-3">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-pink-500" />
                    <div>
                      <p className="font-semibold">Perfect Match</p>
                      <p className="text-sm text-gray-600">
                        Based on your face shape, we recommend the Layered Lob with Honey Blonde highlights
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <BookmarkIcon className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-semibold">Save Your Looks</p>
                      <p className="text-sm text-gray-600">
                        Create a lookbook of your favorite styles to share with your stylist
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ec4899, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #db2777, #2563eb);
        }
      `}</style>
    </div>
  )
}