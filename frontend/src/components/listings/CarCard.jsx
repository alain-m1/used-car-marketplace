// src/components/listings/CarCard.jsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Calendar, 
  Gauge, 
  Eye,
  Heart,
  MessageSquare
} from 'lucide-react'
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters'

export default function CarCard({ listing, onFavorite, isFavorited = false }) {
  const {
    id,
    title,
    price,
    year,
    mileage,
    make,
    model,
    sellerLocation,
    imageUrls,
    viewCount,
    createdAt,
    status
  } = listing

  const primaryImage = imageUrls?.[0] || '/placeholder-car.jpg'
  
  const handleFavoriteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onFavorite) {
      onFavorite(listing)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/listings/${id}`} className="block">
        <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-300">
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={primaryImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                e.target.src = '/placeholder-car.jpg'
              }}
            />
            
            {/* Status Badge */}
            {status && status !== 'ACTIVE' && (
              <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                status === 'SOLD' ? 'bg-red-100 text-red-800' :
                status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status}
              </div>
            )}
            
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                isFavorited 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>

            {/* View Count */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
              <Eye className="h-3 w-3" />
              <span>{formatNumber(viewCount)}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Title and Price */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                {title}
              </h3>
              <div className="text-2xl font-bold text-primary-600">
                {formatPrice(price)}
              </div>
            </div>

            {/* Car Details */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{year}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Gauge className="h-4 w-4" />
                <span>{formatNumber(mileage)} mi</span>
              </div>
            </div>

            {/* Location and Date */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{sellerLocation}</span>
              </div>
              <span>{formatDate(createdAt)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Link
                to={`/listings/${id}`}
                className="flex-1 btn btn-primary text-sm justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                View Details
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Handle contact seller
                }}
                className="btn btn-secondary text-sm p-2"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
