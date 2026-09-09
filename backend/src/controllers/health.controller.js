import mongoose from 'mongoose'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

export const getHealth = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'Service unavailable.', [{ database: 'disconnected' }])
  }
  return res.status(200).json(new ApiResponse(200, { status: 'ok', database: 'connected' }))
})
