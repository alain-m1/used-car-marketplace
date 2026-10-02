// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Settings, 
  Car, 
  Heart, 
  MessageSquare, 
  Edit3,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from 'react-query'
import { listingsAPI } from '../services/api'
import CarCard from '../components/listings/CarCard'

export default function ProfilePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  // Fetch user's listings
  const { data: userListings, isLoading: isLoadingListings } = useQuery(
    'userListings',
    () => listingsAPI.getUserListings(),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'listings', label: 'My Listings', icon: Car },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab user={user} />
      case 'listings':
        return <ListingsTab listings={userListings?.data || []} isLoading={isLoadingListings} />
      case 'favorites':
        return <FavoritesTab />
      case 'messages':
        return <MessagesTab />
      default:
        return <ProfileTab user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-600">@{user?.username}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user?.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{user?.location || 'Location not set'}</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Profile Tab Component
function ProfileTab({ user }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">First Name</label>
              <input type="text" value={user?.firstName || ''} className="input" readOnly />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" value={user?.lastName || ''} className="input" readOnly />
            </div>
            <div>
              <label className="label">Username</label>
              <input type="text" value={user?.username || ''} className="input" readOnly />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <input type="email" value={user?.email || ''} className="input flex-1" readOnly />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <input type="tel" value={user?.phone || 'Not provided'} className="input flex-1" readOnly />
              </div>
            </div>
            <div>
              <label className="label">Location</label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <input type="text" value={user?.location || 'Not provided'} className="input flex-1" readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
        <textarea 
          rows={4} 
          className="input" 
          placeholder="Tell potential buyers/sellers about yourself..."
          value={user?.bio || ''}
          readOnly
        />
      </div>
    </div>
  )
}

// Listings Tab Component
function ListingsTab({ listings, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
        <p className="text-gray-600 mb-6">Start selling by creating your first car listing</p>
        <button className="btn btn-primary">Create First Listing</button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <CarCard key={listing.id} listing={listing} showActions />
      ))}
    </div>
  )
}

// Favorites Tab Component
function FavoritesTab() {
  return (
    <div className="text-center py-12">
      <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
      <p className="text-gray-600">Save listings you're interested in to see them here</p>
    </div>
  )
}

// Messages Tab Component
function MessagesTab() {
  return (
    <div className="text-center py-12">
      <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
      <p className="text-gray-600">Your conversations with buyers and sellers will appear here</p>
    </div>
  )
}
