// src/pages/EditListingPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Car, DollarSign, MapPin, FileText, ArrowLeft } from 'lucide-react'
import { listingsAPI } from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function EditListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: listing, isLoading } = useQuery(
    ['listing', id],
    () => listingsAPI.getListingById(id),
    {
      enabled: !!id,
    }
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // Reset form when listing data is loaded
  useEffect(() => {
    if (listing?.data) {
      reset({
        make: listing.data.make,
        model: listing.data.model,
        year: listing.data.year,
        mileage: listing.data.mileage,
        price: listing.data.price,
        description: listing.data.description,
        city: listing.data.city,
        state: listing.data.state,
        fuelType: listing.data.fuelType,
        transmission: listing.data.transmission,
        bodyType: listing.data.bodyType,
        color: listing.data.color,
      })
    }
  }, [listing, reset])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await listingsAPI.updateListing(id, data)
      toast.success('Listing updated successfully!')
      navigate(`/listings/${id}`)
    } catch (error) {
      toast.error('Failed to update listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!listing?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h2>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Listing
              </h1>
              <p className="text-gray-600">
                Update your {listing.data.year} {listing.data.make} {listing.data.model}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Car Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Car className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Car Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Make *</label>
                  <input
                    type="text"
                    className={`input ${errors.make ? 'input-error' : ''}`}
                    {...register('make', { required: 'Make is required' })}
                  />
                  {errors.make && <p className="error-text">{errors.make.message}</p>}
                </div>

                <div>
                  <label className="label">Model *</label>
                  <input
                    type="text"
                    className={`input ${errors.model ? 'input-error' : ''}`}
                    {...register('model', { required: 'Model is required' })}
                  />
                  {errors.model && <p className="error-text">{errors.model.message}</p>}
                </div>

                <div>
                  <label className="label">Year *</label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className={`input ${errors.year ? 'input-error' : ''}`}
                    {...register('year', { required: 'Year is required' })}
                  />
                  {errors.year && <p className="error-text">{errors.year.message}</p>}
                </div>

                <div>
                  <label className="label">Mileage *</label>
                  <input
                    type="number"
                    min="0"
                    className={`input ${errors.mileage ? 'input-error' : ''}`}
                    {...register('mileage', { required: 'Mileage is required' })}
                  />
                  {errors.mileage && <p className="error-text">{errors.mileage.message}</p>}
                </div>

                <div>
                  <label className="label">Fuel Type</label>
                  <input
                    type="text"
                    className="input"
                    {...register('fuelType')}
                  />
                </div>

                <div>
                  <label className="label">Transmission</label>
                  <input
                    type="text"
                    className="input"
                    {...register('transmission')}
                  />
                </div>

                <div>
                  <label className="label">Body Type</label>
                  <input
                    type="text"
                    className="input"
                    {...register('bodyType')}
                  />
                </div>

                <div>
                  <label className="label">Color</label>
                  <input
                    type="text"
                    className="input"
                    {...register('color')}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <DollarSign className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Pricing</h2>
              </div>

              <div>
                <label className="label">Price *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className={`input ${errors.price ? 'input-error' : ''}`}
                  {...register('price', { required: 'Price is required' })}
                />
                {errors.price && <p className="error-text">{errors.price.message}</p>}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Location</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">City *</label>
                  <input
                    type="text"
                    className={`input ${errors.city ? 'input-error' : ''}`}
                    {...register('city', { required: 'City is required' })}
                  />
                  {errors.city && <p className="error-text">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    className={`input ${errors.state ? 'input-error' : ''}`}
                    {...register('state', { required: 'State is required' })}
                  />
                  {errors.state && <p className="error-text">{errors.state.message}</p>}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Description</h2>
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea
                  rows={6}
                  className={`input ${errors.description ? 'input-error' : ''}`}
                  placeholder="Describe your car's condition, service history, any modifications, etc."
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: { value: 50, message: 'Description must be at least 50 characters' }
                  })}
                />
                {errors.description && <p className="error-text">{errors.description.message}</p>}
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/listings/${id}`)}
                className="btn btn-secondary px-8"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary px-8 flex-1"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating listing...</span>
                  </div>
                ) : (
                  'Update Listing'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
