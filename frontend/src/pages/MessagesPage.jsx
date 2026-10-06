// src/pages/MessagesPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { MessageSquare, Send, User, Car, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { listingsAPI, messagesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

// The API returns LocalDateTime without a zone; the server runs in UTC
const parseSentAt = (value) => {
  if (!value) return null
  const text = String(value)
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(text) ? text : `${text}Z`)
}

const formatTime = (value) => {
  const date = parseSentAt(value)
  return date ? date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''
}

const conversationKey = (listingId, otherUserId) => `${listingId}:${otherUserId}`

export default function MessagesPage() {
  const { user } = useAuth()
  const me = user?.id
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const sellerParam = searchParams.get('seller')
  const listingParam = searchParams.get('listing')

  const [selectedKey, setSelectedKey] = useState(null)
  const [draftListingId, setDraftListingId] = useState(listingParam || '')
  const [messageText, setMessageText] = useState('')
  const bottomRef = useRef(null)

  // Every message the signed-in user sent or received
  const { data: inbox, isLoading } = useQuery(
    ['messages', me],
    () => messagesAPI.getUserMessages(me, { size: 200 }),
    { enabled: !!me, refetchInterval: 15000 }
  )

  // Contact Seller: the listings of the seller being contacted (lets the buyer pick a car when no listing was passed)
  const startingNew = !!sellerParam && String(sellerParam) !== String(me)
  const { data: sellerListings } = useQuery(
    ['sellerListings', sellerParam],
    () => listingsAPI.getListingsBySeller(sellerParam, { size: 50 }),
    { enabled: startingNew, staleTime: 5 * 60 * 1000 }
  )

  const { data: passedListing } = useQuery(
    ['listing', listingParam],
    () => listingsAPI.getListingById(listingParam),
    { enabled: startingNew && !!listingParam, staleTime: 5 * 60 * 1000 }
  )

  useEffect(() => {
    if (sellerParam && String(sellerParam) === String(me)) {
      toast.error('This is your own listing')
    }
  }, [sellerParam, me])

  // Group the flat message list into one conversation per (listing, other person)
  const conversations = useMemo(() => {
    const byKey = new Map()
    const all = inbox?.data?.content || []
    all.forEach((m) => {
      const mine = m.senderId === me
      const otherId = mine ? m.recipientId : m.senderId
      const key = conversationKey(m.carListingId, otherId)
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          otherId,
          otherName: mine ? m.recipientName : m.senderName,
          listingId: m.carListingId,
          listingTitle: m.carListingTitle,
          messages: [],
          unread: 0,
        })
      }
      const convo = byKey.get(key)
      convo.messages.push(m)
      if (m.recipientId === me && !m.isRead) convo.unread += 1
    })
    const list = Array.from(byKey.values())
    list.forEach((c) => c.messages.sort((a, b) => parseSentAt(a.sentAt) - parseSentAt(b.sentAt)))
    list.sort((a, b) => parseSentAt(b.messages.at(-1).sentAt) - parseSentAt(a.messages.at(-1).sentAt))
    return list
  }, [inbox, me])

  // A conversation that does not exist yet (opened via Contact Seller)
  const draftListing = useMemo(() => {
    if (!startingNew) return null
    if (passedListing?.data && String(passedListing.data.sellerId) === String(sellerParam)) return passedListing.data
    const options = sellerListings?.data?.content || []
    return options.find((l) => String(l.id) === String(draftListingId)) || null
  }, [startingNew, passedListing, sellerListings, sellerParam, draftListingId])

  const draftConversation = draftListing
    ? {
        key: conversationKey(draftListing.id, Number(sellerParam)),
        otherId: Number(sellerParam),
        otherName: draftListing.sellerName || 'Seller',
        listingId: draftListing.id,
        listingTitle: draftListing.title,
        messages: [],
        unread: 0,
      }
    : null

  // Selecting: an existing thread wins over the draft with the same key
  const selected =
    conversations.find((c) => c.key === selectedKey) ||
    (draftConversation && (selectedKey === draftConversation.key || !selectedKey) ? draftConversation : null)

  // Opening a conversation marks what was sent to me as read
  useEffect(() => {
    if (!selected) return
    const unread = selected.messages.filter((m) => m.recipientId === me && !m.isRead)
    if (unread.length === 0) return
    Promise.all(unread.map((m) => messagesAPI.markAsRead(m.id)))
      .then(() => {
        queryClient.invalidateQueries(['messages', me])
        queryClient.invalidateQueries(['unreadCount', me])
      })
      .catch(() => {})
  }, [selected?.key, selected?.messages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.key, selected?.messages.length])

  const sendMutation = useMutation((payload) => messagesAPI.sendMessage(payload), {
    onSuccess: () => {
      setMessageText('')
      queryClient.invalidateQueries(['messages', me])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Could not send the message')
    },
  })

  const handleSendMessage = () => {
    const content = messageText.trim()
    if (!content || !selected || sendMutation.isLoading) return
    sendMutation.mutate({
      recipientId: selected.otherId,
      carListingId: selected.listingId,
      content,
    })
    setSelectedKey(selected.key)
    }

  const sellerOptions = sellerListings?.data?.content || []
  const showListingPicker = startingNew && !listingParam && sellerOptions.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-600">Communicate with buyers and sellers</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '70vh' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Conversations list */}
              <div className="border-r border-gray-200 flex flex-col min-h-0">
                {showListingPicker && (
                  <div className="p-4 border-b border-gray-200 bg-primary-50">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Which car are you asking about?
                    </label>
                    <select
                      value={draftListingId}
                      onChange={(e) => {
                        setDraftListingId(e.target.value)
                        setSelectedKey(null)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select a listing</option>
                      {sellerOptions.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="overflow-y-auto flex-1">
                  {isLoading ? (
                    <div className="p-8 flex justify-center">
                      <LoadingSpinner />
                </div>
                  ) : conversations.length === 0 && !draftConversation ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No conversations yet</p>
                    </div>
                  ) : (
                    [
                      ...(draftConversation && !conversations.some((c) => c.key === draftConversation.key)
                        ? [draftConversation]
                        : []),
                      ...conversations,
                    ].map((conversation) => (
                      <div
                        key={conversation.key}
                        onClick={() => setSelectedKey(conversation.key)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selected?.key === conversation.key ? 'bg-primary-50 border-primary-200' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conversation.otherName}
                              </p>
                              <div className="flex items-center space-x-2">
                                {conversation.unread > 0 && (
                                  <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                                    {conversation.unread}
                                  </span>
                                )}
                                {conversation.messages.length > 0 && (
                                <span className="text-xs text-gray-500">
                                    {formatTime(conversation.messages.at(-1).sentAt)}
                                </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 truncate mt-1">{conversation.listingTitle}</p>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.messages.length > 0
                                ? conversation.messages.at(-1).content
                                : 'New conversation'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat area */}
              <div className="lg:col-span-2 flex flex-col min-h-0">
                {selected ? (
                  <>
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                          <h3 className="text-lg font-semibold text-gray-900">{selected.otherName}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Car className="h-4 w-4" />
                            <span>{selected.listingTitle}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {selected.messages.length === 0 && (
                        <p className="text-center text-gray-500 text-sm">
                          Say hello to start the conversation.
                        </p>
                      )}
                      {selected.messages.map((message) => {
                        const isOwn = message.senderId === me
                        return (
                          <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isOwn ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="h-3 w-3 opacity-70" />
                                <span className="text-xs opacity-70">{formatTime(message.sentAt)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={bottomRef} />
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={messageText}
                          maxLength={1000}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendMessage()
                          }}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sendMutation.isLoading}
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                      <p className="text-gray-600">Choose a conversation from the left to start messaging</p>
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
