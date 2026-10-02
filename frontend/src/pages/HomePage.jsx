// src/pages/HomePage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { 
  Search, 
  Car, 
  Shield, 
  MessageSquare, 
  TrendingUp,
  Star,
  ArrowRight,
  Play
} from 'lucide-react'
import { listingsAPI } from '../services/api'
import CarCard from '../components/listings/CarCard'
import SearchFilters from '../components/listings/SearchFilters'

const features = [
  {
    icon: Car,
    title: 'Quality Listings',
    description: 'Browse thousands of verified used cars from trusted sellers.'
  },
  {
    icon: Shield,
    title: 'Secure Transactions',
    description: 'Safe and secure platform with verified seller profiles.'
  },
  {
    icon: MessageSquare,
    title: 'Direct Communication',
    description: 'Chat directly with sellers to get all the details you need.'
  },
  {
    icon: TrendingUp,
    title: 'Market Insights',
    description: 'Get real-time pricing and market trend information.'
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Happy Buyer',
    content: 'Found the perfect car in just a few days. The process was smooth and the seller was very responsive!',
    rating: 5
  },
  {
    name: 'Mike Chen',
    role: 'Satisfied Seller',
    content: 'Sold my car quickly and got a great price. The platform made it so easy to connect with serious buyers.',
    rating: 5
  },
  {
    name: 'Emily Davis',
    role: 'Regular User',
    content: 'Best car marketplace I\'ve used. Great selection, fair prices, and excellent customer service.',
    rating: 5
  }
]

export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch latest listings for homepage
  const { data: latestListings, isLoading: isLoadingLatest } = useQuery(
    'latestListings',
    () => listingsAPI.getLatestListings({ page: 0, size: 6 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Fetch popular listings
  const { data: popularListings, isLoading: isLoadingPopular } = useQuery(
    'popularListings',
    () => listingsAPI.getMostViewedListings({ page: 0, size: 6 }),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/listings')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
            >
              Find Your Perfect
              <span className="block text-blue-200">Used Car Today</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            >
              Discover thousands of quality used cars from trusted sellers. 
              Buy with confidence, sell with ease.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by make, model, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-gray-900 bg-white rounded-lg border-0 shadow-lg focus:ring-4 focus:ring-blue-200 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="btn bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 font-semibold shadow-lg"
                >
                  Search Cars
                </button>
              </form>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/listings"
                className="btn bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 font-semibold shadow-lg"
              >
                Browse All Cars
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <button className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors">
                <Play className="h-5 w-5" />
                <span>Watch How It Works</span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose CarMarket?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make buying and selling used cars simple, secure, and transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Latest Listings
              </h2>
              <p className="text-gray-600">
                Discover the newest cars added to our marketplace
              </p>
            </div>
            <Link
              to="/listings?sort=createdAt,desc"
              className="btn btn-primary"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {isLoadingLatest ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestListings?.data?.content?.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <CarCard listing={listing} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Listings */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Most Popular
              </h2>
              <p className="text-gray-600">
                Cars that are getting the most attention from buyers
              </p>
            </div>
            <Link
              to="/listings?sort=viewCount,desc"
              className="btn btn-primary"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {isLoadingPopular ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularListings?.data?.content?.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <CarCard listing={listing} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied buyers and sellers who trust CarMarket
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card text-center"
              >
                <div className="card-body">
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Find Your Next Car?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of buyers and sellers on the most trusted car marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/listings"
                className="btn bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 font-semibold"
              >
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/auth/register"
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 font-semibold"
              >
                Sell Your Car
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
