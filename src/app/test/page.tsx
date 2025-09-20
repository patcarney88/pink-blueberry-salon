export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 mb-6">
          The Pink Blueberry Salon
        </h1>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Tailwind CSS is Working! 🎨
          </h2>
          <p className="text-blue-600 text-lg mb-4">
            If you can see these beautiful colors, the styling is fixed!
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-pink-500 text-white p-4 rounded-lg text-center">
              <div className="font-bold">Pink</div>
              <div className="text-sm">#ec4899</div>
            </div>
            <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
              <div className="font-bold">Blue</div>
              <div className="text-sm">#3b82f6</div>
            </div>
            <div className="bg-amber-500 text-white p-4 rounded-lg text-center">
              <div className="font-bold">Gold</div>
              <div className="text-sm">#f59e0b</div>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
            Book Your Appointment Now
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-lg border-2 border-pink-200">
            <h3 className="text-xl font-bold text-pink-700 mb-2">Services</h3>
            <ul className="text-pink-600 space-y-1">
              <li>• Hair Styling</li>
              <li>• Color Services</li>
              <li>• Spa Treatments</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
            <h3 className="text-xl font-bold text-blue-700 mb-2">Hours</h3>
            <ul className="text-blue-600 space-y-1">
              <li>Mon-Fri: 9am - 7pm</li>
              <li>Saturday: 9am - 6pm</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border-2 border-amber-300">
          <p className="text-amber-800 text-center font-medium">
            ✨ Premium Luxury Salon Experience ✨
          </p>
        </div>
      </div>
    </div>
  )
}