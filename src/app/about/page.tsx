import Link from 'next/link'
import { Award, Users, Heart, Star, ArrowRight } from 'lucide-react'
import Header from '@/components/Header'

export default function AboutPage() {
  const achievements = [
    {
      year: "2019",
      title: "Salon Opening",
      description: "Founded Pink Blueberry Salon with a vision to create a luxury beauty destination"
    },
    {
      year: "2020",
      title: "Award Recognition",
      description: "Voted 'Best New Salon' by Local Beauty Magazine"
    },
    {
      year: "2021",
      title: "Team Expansion",
      description: "Grew to 12 certified stylists and beauty professionals"
    },
    {
      year: "2022",
      title: "Eco-Certified",
      description: "Achieved Green Circle Salon certification for sustainability"
    },
    {
      year: "2023",
      title: "Master Training",
      description: "Became official Redken and Olaplex certified training center"
    },
    {
      year: "2024",
      title: "Excellence Award",
      description: "Named 'Salon of the Year' with 4.9/5 star rating from 2,000+ clients"
    }
  ]

  const teamMembers = [
    {
      name: "Sarah Mitchell",
      role: "Owner & Master Stylist",
      specialties: ["Color Correction", "Bridal Styling", "Extensions"],
      experience: "15+ years",
      image: "👩‍🦰"
    },
    {
      name: "Amanda Chen",
      role: "Creative Director",
      specialties: ["Balayage", "Fashion Color", "Cutting"],
      experience: "12+ years",
      image: "👩‍🦱"
    },
    {
      name: "Jessica Rodriguez",
      role: "Senior Stylist",
      specialties: ["Curly Hair", "Keratin Treatments", "Styling"],
      experience: "10+ years",
      image: "👩‍🦳"
    },
    {
      name: "Emily Thompson",
      role: "Color Specialist",
      specialties: ["Gray Coverage", "Highlights", "Color Maintenance"],
      experience: "8+ years",
      image: "👱‍♀️"
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
              About <span className="bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent font-bold">Pink Blueberry</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Where luxury meets expertise. Our passion for beauty and commitment to excellence has made us
              the premier destination for transformative hair and beauty experiences.
            </p>
            <div className="flex justify-center items-center space-x-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">2,000+</div>
                <div className="text-gray-600">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">4.9/5</div>
                <div className="text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">5</div>
                <div className="text-gray-600">Years of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Pink Blueberry Salon was born from a simple vision: to create a space where beauty,
                  artistry, and exceptional service converge. Founded in 2019 by master stylist Sarah Mitchell,
                  our salon has grown from a passionate dream into the city&apos;s most trusted beauty destination.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  We believe that every client deserves to feel confident and beautiful. Our team of certified
                  professionals combines years of experience with the latest techniques and premium products
                  to deliver results that exceed expectations.
                </p>
                <div className="flex items-center space-x-4">
                  <Award className="h-8 w-8 text-pink-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Certified Excellence</div>
                    <div className="text-gray-600">Redken & Olaplex training center</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-pink-100 to-blue-100 rounded-3xl p-8">
                <div className="space-y-6">
                  {achievements.slice(0, 3).map((achievement, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-pink-600 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold">
                        {achievement.year.slice(-2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                        <p className="text-gray-600 text-sm">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
              These core principles guide everything we do, from the moment you walk through our doors
              to the final styling touch.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-br from-pink-400 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Passion</h3>
                <p className="text-gray-600">
                  We are passionate about our craft and dedicated to helping every client discover their most
                  beautiful self through expert artistry and personalized care.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Excellence</h3>
                <p className="text-gray-600">
                  We maintain the highest standards in everything we do, from our techniques and products
                  to our customer service and salon environment.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Community</h3>
                <p className="text-gray-600">
                  We believe in building lasting relationships with our clients and giving back to the
                  community that has supported our growth and success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Meet Our Expert Team</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our certified stylists bring decades of combined experience and continuous education
                to deliver exceptional results for every client.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{member.image}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-pink-600 font-medium mb-2">{member.role}</p>
                    <p className="text-gray-600 text-sm">{member.experience}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 text-sm">Specialties:</h4>
                    {member.specialties.map((specialty, i) => (
                      <div key={i} className="flex items-center text-sm text-gray-600">
                        <Star className="h-3 w-3 text-yellow-400 mr-2" />
                        {specialty}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Journey</h2>
              <p className="text-xl text-gray-600">
                From humble beginnings to industry recognition - our story of growth and excellence.
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-pink-600 to-blue-600 rounded"></div>

              {achievements.map((achievement, index) => (
                <div key={index} className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        {achievement.year}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                      <p className="text-gray-600">{achievement.description}</p>
                    </div>
                  </div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-pink-600 to-blue-600 rounded-full border-4 border-white"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Experience the Difference?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied clients who trust Pink Blueberry Salon for their beauty needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-flex items-center bg-gradient-to-r from-pink-600 to-blue-600 text-white px-8 py-4 rounded-full hover:from-pink-700 hover:to-blue-700 transition-all duration-200 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Book Your Appointment <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center border-2 border-pink-600 text-pink-600 px-8 py-4 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-200 text-lg font-medium"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}