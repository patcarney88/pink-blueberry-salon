'use client'

import { useState } from 'react'
import { Sparkles, Send, Loader2, Star, Calendar, ShoppingBag } from 'lucide-react'

interface Recommendations {
  services: Array<{
    name: string
    price: number
    duration: number
    description: string
    match: number
  }>
  products: Array<{
    name: string
    price: number
    description: string
    match: number
  }>
}

interface AdvisorResponse {
  recommendations: Recommendations
  insights: string[]
  routine: {
    morning: string[]
    evening: string[]
    weekly: string[]
  }
  matchScore: number
  nextSteps: string[]
}

export default function BeautyAdvisor() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [responses, setResponses] = useState({
    skinType: '',
    hairType: '',
    concerns: [] as string[],
    budget: ''
  })
  const [results, setResults] = useState<AdvisorResponse | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/beauty-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responses)
      })
      const data = await response.json()
      setResults(data)
      setStep(5)
    } catch (error) {
      console.error('Error getting recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetAdvisor = () => {
    setStep(1)
    setResponses({
      skinType: '',
      hairType: '',
      concerns: [],
      budget: ''
    })
    setResults(null)
  }

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all duration-300 z-50 group"
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
        <span className="absolute -top-12 right-0 bg-black text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI Beauty Advisor ✨
        </span>
      </button>

      {/* AI Advisor Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">AI Beauty Advisor</h2>
                    <p className="text-sm opacity-90">Get personalized recommendations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                  <p className="text-gray-600">Analyzing your beauty profile...</p>
                </div>
              ) : step === 5 && results ? (
                // Results View
                <div className="space-y-6">
                  {/* Match Score */}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-pink-100 to-blue-100 mb-3">
                      <span className="text-3xl font-bold text-purple-600">
                        {results.matchScore}%
                      </span>
                    </div>
                    <p className="text-gray-600">Match Score</p>
                  </div>

                  {/* Insights */}
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">AI Insights</h3>
                    <ul className="space-y-2">
                      {results.insights.map((insight, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start">
                          <Sparkles className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Services */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Recommended Services</h3>
                    <div className="space-y-3">
                      {results.recommendations.services.map((service, i) => (
                        <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{service.name}</h4>
                            <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                              {service.match}% match
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-600 font-semibold">${service.price}</span>
                            <span className="text-sm text-gray-500">{service.duration} min</span>
                          </div>
                          <button className="mt-3 w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 rounded-lg hover:opacity-90 transition-opacity text-sm">
                            Book Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Products */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Recommended Products</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {results.recommendations.products.map((product, i) => (
                        <div key={i} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-purple-600 font-semibold">${product.price}</span>
                            <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily Routine */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Your Personalized Routine</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">Morning</h4>
                        <ul className="space-y-1">
                          {results.routine.morning.map((item, i) => (
                            <li key={i} className="text-gray-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">Evening</h4>
                        <ul className="space-y-1">
                          {results.routine.evening.map((item, i) => (
                            <li key={i} className="text-gray-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">Weekly</h4>
                        <ul className="space-y-1">
                          {results.routine.weekly.map((item, i) => (
                            <li key={i} className="text-gray-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={resetAdvisor}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Start New Consultation
                  </button>
                </div>
              ) : (
                // Question Steps
                <div>
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${(step / 4) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Step {step} of 4</p>
                  </div>

                  {/* Step 1: Skin Type */}
                  {step === 1 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">What's your skin type?</h3>
                      <div className="space-y-3">
                        {['dry', 'oily', 'combination', 'normal', 'sensitive'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setResponses({ ...responses, skinType: type })
                              setStep(2)
                            }}
                            className="w-full text-left p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all capitalize"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Hair Type */}
                  {step === 2 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">What's your hair type?</h3>
                      <div className="space-y-3">
                        {['straight', 'wavy', 'curly', 'coily', 'mixed'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setResponses({ ...responses, hairType: type })
                              setStep(3)
                            }}
                            className="w-full text-left p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all capitalize"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Concerns */}
                  {step === 3 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">What are your main concerns? (Select all that apply)</h3>
                      <div className="space-y-3">
                        {['anti-aging', 'acne', 'dryness', 'oiliness', 'dark spots', 'sensitivity'].map((concern) => (
                          <label
                            key={concern}
                            className="flex items-center p-4 border rounded-lg hover:bg-purple-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={responses.concerns.includes(concern)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setResponses({ ...responses, concerns: [...responses.concerns, concern] })
                                } else {
                                  setResponses({ ...responses, concerns: responses.concerns.filter(c => c !== concern) })
                                }
                              }}
                              className="mr-3"
                            />
                            <span className="capitalize">{concern}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => setStep(4)}
                        className="mt-4 w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 4: Budget */}
                  {step === 4 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">What's your budget preference?</h3>
                      <div className="space-y-3">
                        {[
                          { value: 'budget', label: 'Budget Friendly', desc: 'Under $100 per service' },
                          { value: 'moderate', label: 'Moderate', desc: '$100-250 per service' },
                          { value: 'premium', label: 'Premium', desc: '$250+ per service' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setResponses({ ...responses, budget: option.value })
                              handleSubmit()
                            }}
                            className="w-full text-left p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                          >
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-600">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}