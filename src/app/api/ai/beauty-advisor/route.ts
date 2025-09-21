import { NextRequest, NextResponse } from 'next/server'

// AI Beauty Advisor - Personalized recommendations based on user preferences
export async function POST(request: NextRequest) {
  try {
    const { skinType, hairType, concerns, budget } = await request.json()

    // Simulate AI processing (in production, this would call OpenAI/Claude API)
    const recommendations = generatePersonalizedRecommendations({
      skinType,
      hairType,
      concerns,
      budget
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Beauty advisor error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

function generatePersonalizedRecommendations({
  skinType,
  hairType,
  concerns,
  budget
}: {
  skinType: string
  hairType: string
  concerns: string[]
  budget: string
}) {
  // AI-powered recommendation logic
  const services = []
  const products = []

  // Skin recommendations
  if (skinType === 'dry') {
    services.push({
      name: 'Hydrating Facial Treatment',
      price: 120,
      duration: 60,
      description: 'Deep moisture therapy with hyaluronic acid',
      match: 95
    })
    products.push({
      name: 'Intensive Moisture Serum',
      price: 45,
      description: '24-hour hydration boost',
      match: 92
    })
  } else if (skinType === 'oily') {
    services.push({
      name: 'Purifying Clay Facial',
      price: 110,
      duration: 50,
      description: 'Oil control and pore refinement',
      match: 93
    })
    products.push({
      name: 'Mattifying Control Gel',
      price: 35,
      description: 'All-day oil control',
      match: 90
    })
  } else if (skinType === 'combination') {
    services.push({
      name: 'Balancing Facial Treatment',
      price: 115,
      duration: 55,
      description: 'Targets both dry and oily zones',
      match: 94
    })
  }

  // Hair recommendations
  if (hairType === 'curly') {
    services.push({
      name: 'Curl Definition Treatment',
      price: 85,
      duration: 45,
      description: 'Enhance and define natural curls',
      match: 91
    })
    products.push({
      name: 'Curl Enhancing Cream',
      price: 28,
      description: 'Frizz control and curl definition',
      match: 88
    })
  } else if (hairType === 'straight') {
    services.push({
      name: 'Silk & Shine Treatment',
      price: 75,
      duration: 40,
      description: 'Ultimate smoothness and shine',
      match: 89
    })
  } else if (hairType === 'wavy') {
    services.push({
      name: 'Beach Wave Styling',
      price: 65,
      duration: 35,
      description: 'Effortless beachy waves',
      match: 87
    })
  }

  // Concern-based recommendations
  if (concerns.includes('anti-aging')) {
    services.push({
      name: 'Collagen Boost Therapy',
      price: 150,
      duration: 75,
      description: 'Reduce fine lines and wrinkles',
      match: 96
    })
    products.push({
      name: 'Retinol Night Cream',
      price: 65,
      description: 'Advanced anti-aging formula',
      match: 93
    })
  }

  if (concerns.includes('acne')) {
    services.push({
      name: 'Acne Clarifying Treatment',
      price: 95,
      duration: 50,
      description: 'Clear skin therapy',
      match: 94
    })
    products.push({
      name: 'Spot Treatment Gel',
      price: 25,
      description: 'Fast-acting blemish control',
      match: 91
    })
  }

  // Budget-based filtering
  const budgetLimit = budget === 'budget' ? 100 : budget === 'premium' ? 500 : 250
  const filteredServices = services.filter(s => s.price <= budgetLimit)
  const filteredProducts = products.filter(p => p.price <= budgetLimit * 0.3)

  // AI Insights
  const insights = [
    `Based on your ${skinType} skin type, we recommend focusing on ${
      skinType === 'dry' ? 'hydration' : skinType === 'oily' ? 'oil control' : 'balance'
    }.`,
    `Your ${hairType} hair would benefit most from ${
      hairType === 'curly' ? 'moisture and definition' :
      hairType === 'straight' ? 'smoothing treatments' :
      'texturizing services'
    }.`,
    concerns.length > 0 ?
      `We've prioritized treatments for ${concerns.join(' and ')}.` :
      'Regular maintenance will keep you looking fabulous!',
    `With your ${budget} budget, we've selected the most effective treatments.`
  ]

  // Personalized routine
  const routine = {
    morning: [
      'Gentle cleanser',
      skinType === 'dry' ? 'Hydrating toner' : 'Balancing toner',
      'Vitamin C serum',
      'Moisturizer with SPF'
    ],
    evening: [
      'Makeup remover',
      'Deep cleanser',
      concerns.includes('anti-aging') ? 'Retinol serum' : 'Repair serum',
      'Night cream'
    ],
    weekly: [
      skinType === 'oily' ? 'Clay mask (2x)' : 'Hydrating mask (2x)',
      'Gentle exfoliation',
      'Hair mask treatment'
    ]
  }

  return {
    recommendations: {
      services: filteredServices.sort((a, b) => b.match - a.match).slice(0, 3),
      products: filteredProducts.sort((a, b) => b.match - a.match).slice(0, 4),
    },
    insights,
    routine,
    matchScore: Math.round(
      (filteredServices.concat(filteredProducts as any)
        .reduce((acc, item) => acc + item.match, 0) /
        (filteredServices.length + filteredProducts.length)) || 85
    ),
    nextSteps: [
      'Book a consultation for personalized advice',
      'Start with our recommended signature treatment',
      'Join our beauty rewards program for exclusive offers'
    ]
  }
}