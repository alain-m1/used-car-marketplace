// src/pages/dashboard/DashboardPage.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp,
  Eye,
  MessageSquare,
  Settings
} from 'lucide-react'

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('30d')

  // Mock dashboard data
  const stats = [
    {
      title: 'Total Listings',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: Car,
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: '5,678',
      change: '+8.2%',
      trend: 'up', 
      icon: Users,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: '$23,456',
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'yellow'
    },
    {
      title: 'Page Views',
      value: '89,012',
      change: '+5.7%',
      trend: 'up',
      icon: Eye,
      color: 'purple'
    }
  ]

  const recentActivity = [
    { id: 1, type: 'listing', message: 'New listing: 2020 Toyota Camry', time: '2 minutes ago' },
    { id: 2, type: 'user', message: 'John Smith registered', time: '15 minutes ago' },
    { id: 3, type: 'message', message: 'New message from Sarah Johnson', time: '1 hour ago' },
    { id: 4, type: 'listing', message: 'Listing sold: 2019 Honda Civic', time: '2 hours ago' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Monitor your platform's performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="btn btn-primary">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <div className={`flex items-center space-x-1 mt-2 text-sm ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-4 w-4" />
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Listings Over Time
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Chart placeholder</p>
                  <p className="text-sm text-gray-400">Integration with charting library needed</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'listing' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      {activity.type === 'user' && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                      {activity.type === 'message' && (
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="btn btn-primary">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </button>
              <button className="btn btn-secondary">
                <Car className="h-4 w-4 mr-2" />
                Review Listings
              </button>
              <button className="btn btn-secondary">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Messages
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
