// src/pages/MessagesPage.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Search, 
  Send, 
  MoreHorizontal,
  User,
  Car,
  Clock
} from 'lucide-react'

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageText, setMessageText] = useState('')

  // Mock conversations data
  const conversations = [
    {
      id: 1,
      user: { name: 'John Smith', avatar: null },
      listing: { id: 1, title: '2020 Toyota Camry', image: '/api/placeholder/100/80' },
      lastMessage: 'Is the car still available?',
      timestamp: '2 hours ago',
      unread: 2
    },
    {
      id: 2,
      user: { name: 'Sarah Johnson', avatar: null },
      listing: { id: 2, title: '2019 Honda Civic', image: '/api/placeholder/100/80' },
      lastMessage: 'Can we schedule a test drive?',
      timestamp: '1 day ago',
      unread: 0
    },
    {
      id: 3,
      user: { name: 'Mike Chen', avatar: null },
      listing: { id: 3, title: '2018 Ford F-150', image: '/api/placeholder/100/80' },
      lastMessage: 'Thanks for the quick response!',
      timestamp: '3 days ago',
      unread: 0
    }
  ]

  // Mock messages for selected conversation
  const messages = selectedConversation ? [
    {
      id: 1,
      senderId: selectedConversation.user.id,
      text: 'Hi! I\'m interested in your 2020 Toyota Camry. Is it still available?',
      timestamp: '2:30 PM',
      isOwn: false
    },
    {
      id: 2,
      senderId: 'current-user',
      text: 'Yes, it\'s still available! Would you like to schedule a viewing?',
      timestamp: '2:45 PM',
      isOwn: true
    },
    {
      id: 3,
      senderId: selectedConversation.user.id,
      text: 'That would be great! What times work for you this weekend?',
      timestamp: '3:00 PM',
      isOwn: false
    }
  ] : []

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      // Add message sending logic here
      setMessageText('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-600">Communicate with buyers and sellers</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '70vh' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Conversations List */}
              <div className="border-r border-gray-200">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div className="overflow-y-auto h-full">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No conversations yet</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation?.id === conversation.id ? 'bg-primary-50 border-primary-200' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {conversation.user.avatar ? (
                              <img
                                src={conversation.user.avatar}
                                alt={conversation.user.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conversation.user.name}
                              </p>
                              <div className="flex items-center space-x-2">
                                {conversation.unread > 0 && (
                                  <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                                    {conversation.unread}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {conversation.timestamp}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <img
                                src={conversation.listing.image}
                                alt={conversation.listing.title}
                                className="w-8 h-6 object-cover rounded"
                              />
                              <p className="text-xs text-gray-600 truncate">
                                {conversation.listing.title}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-2 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {selectedConversation.user.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Car className="h-4 w-4" />
                              <span>{selectedConversation.listing.title}</span>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.isOwn
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="h-3 w-3 opacity-70" />
                              <span className="text-xs opacity-70">{message.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSendMessage()
                            }
                          }}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim()}
                          className="btn btn-primary p-2"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-600">
                        Choose a conversation from the left to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
