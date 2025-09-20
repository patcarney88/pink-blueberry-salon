import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, Calendar, Star, MessageCircle } from 'lucide-react'
import Header from '@/components/Header'

export default function ContactPage() {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      details: [
        "123 Beauty Boulevard",
        "Downtown District",
        "Your City, ST 12345"
      ],
      action: "Get Directions"
    },
    {
      icon: Phone,
      title: "Phone",
      details: [
        "(555) 123-PINK",
        "(555) 123-7465"
      ],
      action: "Call Now"
    },
    {
      icon: Mail,
      title: "Email",
      details: [
        "hello@pinkblueberrysalon.com",
        "book@pinkblueberrysalon.com"
      ],
      action: "Send Email"
    },
    {
      icon: Clock,
      title: "Hours",
      details: [
        "Mon-Fri: 9:00 AM - 8:00 PM",
        "Saturday: 8:00 AM - 6:00 PM",
        "Sunday: 10:00 AM - 5:00 PM"
      ],
      action: "Book Online"
    }
  ]

  const faqs = [
    {
      question: "How far in advance should I book my appointment?",
      answer: "We recommend booking 1-2 weeks in advance for regular services and 3-4 weeks for special occasions like weddings. Popular times fill up quickly!"
    },
    {
      question: "What should I expect during my first visit?",
      answer: "Your first visit includes a comprehensive consultation to understand your hair goals, lifestyle, and preferences. We&apos;ll discuss your hair history and create a personalized plan."
    },
    {
      question: "Do you offer color consultations?",
      answer: "Yes! We offer complimentary 15-minute color consultations to discuss your vision and determine the best approach for achieving your desired look."
    },
    {
      question: "What products do you use?",
      answer: "We use premium professional brands including Redken, Olaplex, and Kevin Murphy. All products are carefully selected for quality and performance."
    },
    {
      question: "Can I reschedule or cancel my appointment?",
      answer: "Yes, we require 24-hour notice for cancellations or rescheduling. This helps us accommodate other clients and maintain our schedule."
    },
    {
      question: "Do you offer bridal services?",
      answer: "Absolutely! We specialize in bridal hair and offer trials, wedding day services, and bridal party packages. Contact us to discuss your special day."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6">
              Get In <span className="bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent font-bold">Touch</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Ready to transform your look? We&apos;re here to answer your questions and help you book
              the perfect appointment for your beauty goals.
            </p>
            <div className="flex justify-center items-center space-x-1 text-yellow-500 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
              <span className="ml-3 text-gray-600 text-lg">4.9/5 from 2,000+ happy clients</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactInfo.map((info, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group text-center">
                  <div className="bg-gradient-to-br from-pink-400 to-blue-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <info.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{info.title}</h3>
                  <div className="space-y-2 mb-6">
                    {info.details.map((detail, i) => (
                      <p key={i} className="text-gray-600">{detail}</p>
                    ))}
                  </div>
                  <button className="text-pink-600 hover:text-pink-800 font-medium group-hover:translate-y-1 transition-all">
                    {info.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
              <p className="text-xl text-gray-600">
                Have a question or special request? We&apos;d love to hear from you!
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                    Service Interest
                  </label>
                  <select
                    id="service"
                    name="service"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a service (optional)</option>
                    <option value="cut-style">Hair Cut & Style</option>
                    <option value="color">Hair Color</option>
                    <option value="highlights">Highlights/Balayage</option>
                    <option value="treatment">Hair Treatment</option>
                    <option value="extensions">Extensions</option>
                    <option value="bridal">Bridal Services</option>
                    <option value="consultation">Consultation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about your hair goals, questions, or special requests..."
                  ></textarea>
                </div>

                <div className="flex items-center">
                  <input
                    id="newsletter"
                    name="newsletter"
                    type="checkbox"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
                    I&apos;d like to receive beauty tips and special offers via email
                  </label>
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="inline-flex items-center bg-gradient-to-r from-pink-600 to-blue-600 text-white px-8 py-4 rounded-full hover:from-pink-700 hover:to-blue-700 transition-all duration-200 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Send Message <MessageCircle className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">
                Get answers to common questions about our services and policies.
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-20 bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Visit Our Salon</h2>
              <p className="text-xl text-gray-600">
                Located in the heart of downtown, we&apos;re easy to find with convenient parking.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-200 to-blue-200 rounded-3xl h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-700 font-medium">Interactive Map</p>
                <p className="text-gray-600">Google Maps integration would go here</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Free Parking Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Public Transit Accessible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Book Your Appointment?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Don&apos;t wait to start your beauty transformation. Book online or call us today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-flex items-center bg-gradient-to-r from-pink-600 to-blue-600 text-white px-8 py-4 rounded-full hover:from-pink-700 hover:to-blue-700 transition-all duration-200 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Book Online <Calendar className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="tel:(555)123-7465"
                className="inline-flex items-center border-2 border-pink-600 text-pink-600 px-8 py-4 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-200 text-lg font-medium"
              >
                Call Now <Phone className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}