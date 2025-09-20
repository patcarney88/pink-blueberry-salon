import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Star, Users, Award, Heart } from 'lucide-react'
import Link from 'next/link'

const services = [
  {
    title: 'Hair Services',
    description: 'Expert cutting, coloring, and styling for all hair types',
    icon: '✂️',
    features: ['Haircuts', 'Color & Highlights', 'Treatments', 'Styling'],
    price: 'From $45',
  },
  {
    title: 'Nail Services',
    description: 'Professional manicures, pedicures, and nail art',
    icon: '💅',
    features: ['Manicures', 'Pedicures', 'Gel & Acrylic', 'Nail Art'],
    price: 'From $35',
  },
  {
    title: 'Spa Treatments',
    description: 'Relaxing massages and rejuvenating facials',
    icon: '🧖‍♀️',
    features: ['Swedish Massage', 'Deep Tissue', 'Facials', 'Body Wraps'],
    price: 'From $80',
  },
  {
    title: 'Beauty Services',
    description: 'Complete makeup and beauty treatments',
    icon: '💄',
    features: ['Makeup', 'Lash Extensions', 'Brow Shaping', 'Waxing'],
    price: 'From $40',
  },
]

const stats = [
  { value: '10+', label: 'Years of Excellence' },
  { value: '5000+', label: 'Happy Clients' },
  { value: '25+', label: 'Expert Stylists' },
  { value: '4.9', label: 'Average Rating' },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <Badge className="mb-4 bg-gradient-to-r from-pink-600 to-blue-600">
              ✨ Welcome to Excellence
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                Pink Blueberry
              </span>{' '}
              Salon
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience luxury beauty services and wellness treatments in a relaxing atmosphere.
              Your transformation begins here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-700 hover:to-blue-700">
                  <Calendar className="h-5 w-5" />
                  Book Appointment
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From hair styling to spa treatments, we offer a complete range of beauty services
              delivered by expert professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-3">{service.icon}</div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="text-pink-500">•</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-primary">{service.price}</span>
                    <Button size="sm" variant="outline">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Pink Blueberry?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine expertise, luxury, and personalized care to deliver an exceptional experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-white mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Expert Team</h3>
              <p className="text-sm text-muted-foreground">
                Our certified professionals have years of experience and ongoing training.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-white mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Premium Products</h3>
              <p className="text-sm text-muted-foreground">
                We use only the highest quality, professional-grade products.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-white mb-4">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Personalized Care</h3>
              <p className="text-sm text-muted-foreground">
                Every service is tailored to your unique needs and preferences.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-white mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Hours</h3>
              <p className="text-sm text-muted-foreground">
                Open 7 days a week with extended hours to fit your schedule.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-white mb-4">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">5-Star Service</h3>
              <p className="text-sm text-muted-foreground">
                Consistently rated 5 stars by our clients for exceptional service.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center text-white mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Easy Booking</h3>
              <p className="text-sm text-muted-foreground">
                Book online 24/7 or call us for same-day appointments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Your Transformation?</h2>
          <p className="text-xl mb-8 opacity-90">
            Book your appointment today and experience the Pink Blueberry difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <Button size="lg" variant="secondary" className="gap-2">
                <Calendar className="h-5 w-5" />
                Book Online Now
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Clock className="h-5 w-5" />
              Call (555) 123-4567
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}