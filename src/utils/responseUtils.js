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
    return response.status(code).json({ status: 'error', error: message });
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
}
