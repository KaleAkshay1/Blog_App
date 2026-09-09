class ApiError extends Error {
  constructor(status = 500, message = 'Something went wrong. Please try again.', error = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.error = error
    this.success = false
    Error.captureStackTrace(this, this.constructor)
  }
}

export default ApiError
