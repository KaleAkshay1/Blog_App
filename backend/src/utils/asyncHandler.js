const asyncHandler = (controller) => {
  return async (req, res, next) => {
    try {
      return await controller(req, res, next)
    } catch (error) {
      // The error middleware handles formatting and logging in one place.
      next(error)
    }
  }
}

export default asyncHandler
