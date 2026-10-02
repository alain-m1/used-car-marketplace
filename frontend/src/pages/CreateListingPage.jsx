// src/pages/CreateListingPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { 
  Upload, 
  X, 
  Plus,
  Car,
  DollarSign,
  MapPin,
  FileText
} from 'lucide-react'
import { listingsAPI } from '../services/api'
import toast from 'react-hot-toast'

const CAR_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz',
  'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus',
  'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Buick', 'GMC', 'Ram',
  'Jeep', 'Chrysler', 'Dodge', 'Volvo', 'Jaguar', 'Land Rover', 'Porsche',
  'Tesla', 'Mitsubishi', 'Suzuki', 'Other'
]

const FUEL_TYPES = [
  'Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid', 'Flex Fuel'
]

const TRANSMISSIONS = [
  'Automatic', 'Manual', 'CVT', 'Semi-Automatic'
]

const BODY_TYPES = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 
  'Pickup', 'Van', 'Crossover', 'Minivan'
]

export default function CreateListingPage() {
  const [images, setImages] = useState([])
  const [features, setFeatures] = useState([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const selectedMake = watch('make')

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const maxFiles = 10
    
    if (images.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`)
      return
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const addFeature = () => {
    setFeatures(prev => [...prev, ''])
  }

  const updateFeature = (index, value) => {
    setFeatures(prev => prev.map((feature, i) => 
      i === index ? value : feature
    ))
  }

  const removeFeature = (index) => {
    setFeatures(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    if (images.length === 0) {
      toast.error('Please upload at least one image')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      
      // Add car details
      Object.keys(data).forEach(key => {
        if (data[key] !== '') {
          formData.append(key, data[key])
        }
      })

      // Add features
      const validFeatures = features.filter(f => f.trim())
      formData.append('features', JSON.stringify(validFeatures))

      // Add images
      images.forEach((image, index) => {
        formData.append('images', image.file)
      })

      const response = await listingsAPI.createListing(formData)
      
      toast.success('Listing created successfully!')
      navigate(`/listings/${response.data.id}`)
    } catch (error) {
      toast.error('Failed to create listing. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              List Your Car
            </h1>
            <p className="text-gray-600">
              Create a detailed listing to attract serious buyers
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Car Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Car className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Car Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Make */}
                <div>
                  <label className="label">Make *</label>
                  <select
                    className={`input ${errors.make ? 'input-error' : ''}`}
                    {...register('make', { required: 'Make is required' })}
                  >
                    <option value="">Select make</option>
                    {CAR_MAKES.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                  {errors.make && <p className="error-text">{errors.make.message}</p>}
                </div>

                {/* Model */}
                <div>
                  <label className="label">Model *</label>
                  <input
                    type="text"
                    className={`input ${errors.model ? 'input-error' : ''}`}
                    placeholder="Enter model"
                    {...register('model', { required: 'Model is required' })}
                  />
                  {errors.model && <p className="error-text">{errors.model.message}</p>}
                </div>

                {/* Year */}
                <div>
                  <label className="label">Year *</label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className={`input ${errors.year ? 'input-error' : ''}`}
                    placeholder="2020"
                    {...register('year', { 
                      required: 'Year is required',
                      min: { value: 1990, message: 'Year must be 1990 or later' },
                      max: { value: new Date().getFullYear() + 1, message: 'Invalid year' }
                    })}
                  />
                  {errors.year && <p className="error-text">{errors.year.message}</p>}
                </div>

                {/* Mileage */}
                <div>
                  <label className="label">Mileage *</label>
                  <input
                    type="number"
                    min="0"
                    className={`input ${errors.mileage ? 'input-error' : ''}`}
                    placeholder="50000"
                    {...register('mileage', { 
                      required: 'Mileage is required',
                      min: { value: 0, message: 'Mileage cannot be negative' }
                    })}
                  />
                  {errors.mileage && <p className="error-text">{errors.mileage.message}</p>}
                </div>

                {/* Body Type */}
                <div>
                  <label className="label">Body Type</label>
                  <select className="input" {...register('bodyType')}>
                    <option value="">Select body type</option>
                    {BODY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="label">Fuel Type</label>
                  <select className="input" {...register('fuelType')}>
                    <option value="">Select fuel type</option>
                    {FUEL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Transmission */}
                <div>
                  <label className="label">Transmission</label>
                  <select className="input" {...register('transmission')}>
                    <option value="">Select transmission</option>
                    {TRANSMISSIONS.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="label">Color</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter color"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Asking Price *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className={`input ${errors.price ? 'input-error' : ''}`}
                    placeholder="15000"
                    {...register('price', { 
                      required: 'Price is required',
                      min: { value: 1, message: 'Price must be greater than 0' }
                    })}
                  />
                  {errors.price && <p className="error-text">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="label">
                    Negotiable
                    <span className="text-sm text-gray-500 ml-2">(Optional)</span>
                  </label>
                  <select className="input" {...register('negotiable')}>
                    <option value="true">Yes, price is negotiable</option>
                    <option value="false">No, firm price</option>
                  </select>
                </div>
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
                    placeholder="Enter city"
                    {...register('city', { required: 'City is required' })}
                  />
                  {errors.city && <p className="error-text">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    className={`input ${errors.state ? 'input-error' : ''}`}
                    placeholder="Enter state"
                    {...register('state', { required: 'State is required' })}
                  />
                  {errors.state && <p className="error-text">{errors.state.message}</p>}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Upload className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
                <span className="text-sm text-gray-500">(At least 1 required, max 10)</span>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Upload car photos
                  </p>
                  <p className="text-sm text-gray-600">
                    Drag and drop files here or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum file size: 5MB per image
                  </p>
                </label>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Description & Features</h2>
              </div>

              <div className="space-y-6">
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

                {/* Features */}
                <div>
                  <label className="label">Features (Optional)</label>
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          className="input flex-1"
                          placeholder="e.g., Air Conditioning, Bluetooth, etc."
                        />
                        {features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFeature}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add feature</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
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
                    <span>Creating listing...</span>
                  </div>
                ) : (
                  'Create Listing'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
