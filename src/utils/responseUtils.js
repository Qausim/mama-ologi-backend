/**
 * Defines reusable functions that returns responses
 */
export default class Responses {
  /**
   * Defines the specification for unauthorized access errors
   * @param {object} response
   * @param {string} message
   * @param {number} code
   * @returns {object} response
   */
  static unauthorizedError(response, message, code = 401) {
    return response.status(code).json({ status: 'error', error: { message } });
  }

  /**
   * Defines the specification for responses in success cases
   * @param {object} response
   * @param {string} message
   * @param {number} code
   * @returns {object} response
   */
  static success(response, data, code = 200) {
    return response.status(code).json({ status: 'success', data });
  }

  /**
   * Defines the specification for responses in bad request cases
   * @param {object} response
   * @param {object} error
   * @param {number} code
   * @returns {object} response
   */
  static badRequestError(response, error, code = 400) {
    return response.status(code).json({ status: 'error', error });
  }

  /**
   * Defines the specification for responses in not found error cases
   * @param {object} response
   * @param {string} message
   * @returns {object} response
   */
  static notFoundError(response, message) {
    return response.status(404).json({
      status: 'error',
      error: { message },
    });
  }

  /**
   * Defines the specification for responses in not conflict error cases
   * @param {object} response
   * @param {string} message
   * @returns {object} response
   */
  static conflictError(response, message) {
    return response.status(409).json({
      status: 'error',
      error: { message },
    });
  }

  /**
   * Defines the specification for responses in forbidden error cases
   * @param {object} response
   * @param {string} message
   */
  static forbiddenError(response, message) {
    return response.status(403).json({
      status: 'error',
      error: { message },
    });
  }
}
