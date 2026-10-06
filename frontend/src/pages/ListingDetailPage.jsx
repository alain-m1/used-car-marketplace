// src/pages/ListingDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  Calendar, 
  Gauge, 
  Fuel, 
  Settings, 
  Shield,
  Phone,
  MessageSquare,
  Eye,
  Camera,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { listingsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ListingDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Fetch listing details
  const { data: listing, isLoading, error } = useQuery(
    ['listing', id],
    () => listingsAPI.getListingById(id),
    {
      // The backend increments the view count as part of GET /listings/{id}
      enabled: !!id,
    }
  )

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Please login to save listings')
      navigate('/auth/login')
      return
    }

    try {
      // Toggle wishlist logic here
      setIsWishlisted(!isWishlisted)
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
    } catch (error) {
      toast.error('Failed to update wishlist')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${listing.data.year} ${listing.data.make} ${listing.data.model}`,
        text: `Check out this ${listing.data.year} ${listing.data.make} ${listing.data.model} for $${listing.data.price.toLocaleString()}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleContact = () => {
    if (!user) {
      toast.error('Please login to contact seller')
      navigate('/auth/login')
      return
    }
    // Navigate to messages or open contact modal
    navigate(`/messages?seller=${listing.data.sellerId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !listing?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h2>
          <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist or has been removed.</p>
          <Link to="/listings" className="btn btn-primary">
            Browse All Listings
          </Link>
        </div>
      </div>
    )
  }

  const car = listing.data
  const images = car.imageUrls?.length ? car.imageUrls : ['/placeholder-car.jpg']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to listings</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="relative">
                <img
                  src={images[currentImageIndex]}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="w-full h-96 object-cover"
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? images.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  <Camera className="h-4 w-4 inline mr-1" />
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-primary-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {car.year} {car.make} {car.model}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{car.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{car.viewCount || 0} views</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleWishlist}
                    className={`p-2 rounded-full border ${
                      isWishlisted ? 'border-red-500 text-red-500' : 'border-gray-300 text-gray-600'
                    } hover:scale-105 transition-transform`}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full border border-gray-300 text-gray-600 hover:scale-105 transition-transform"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Key Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Year</div>
                  <div className="font-semibold">{car.year}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Gauge className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Mileage</div>
                  <div className="font-semibold">{car.mileage?.toLocaleString()} mi</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Fuel className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Fuel Type</div>
                  <div className="font-semibold">{car.fuelType || 'Gasoline'}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Settings className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Transmission</div>
                  <div className="font-semibold">{car.transmission || 'Automatic'}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {car.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {car.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price & Contact */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  ${car.price?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  Listed {new Date(car.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleContact}
                  className="w-full btn btn-primary"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Seller
                </button>
                <button
                  className="w-full btn btn-secondary"
                  disabled={!car.sellerPhone}
                  title={car.sellerPhone ? undefined : 'The seller has not added a phone number'}
                  onClick={() => window.open(`tel:${car.sellerPhone}`, '_self')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Seller
                </button>
              </div>

              {/* Seller Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Seller Information</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {car.sellerName?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {car.sellerName || 'Seller'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {car.sellerLocation && car.sellerLocation !== 'Not specified'
                        ? car.sellerLocation
                        : `Listed ${new Date(car.createdAt).getFullYear()}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Safety Tips</h4>
              </div>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• Meet in a public place for test drives</li>
                <li>• Inspect the vehicle thoroughly</li>
                <li>• Verify all documents</li>
                <li>• Never wire money or pay in advance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}