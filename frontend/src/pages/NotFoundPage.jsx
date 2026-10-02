// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, Car, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-primary-600 mb-4">404</div>
          <div className="flex justify-center space-x-2 mb-4">
            <Car className="h-12 w-12 text-gray-300 transform rotate-12" />
            <Car className="h-8 w-8 text-gray-400 transform -rotate-6 mt-2" />
            <Car className="h-10 w-10 text-gray-300 transform rotate-45 mt-1" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. 
          The page might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn btn-primary flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
            <Link
              to="/listings"
              className="btn btn-secondary flex items-center justify-center"
            >
              <Search className="h-4 w-4 mr-2" />
              Browse Cars
            </Link>
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center space-x-2 text-primary-600 hover:text-primary-700 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team or check our{' '}
            <Link to="/help" className="text-primary-600 hover:text-primary-700">
              help center
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
