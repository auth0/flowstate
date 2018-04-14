/**
 * Module dependencies.
 */
var State = require('../state')
  , MissingStateError = require('../errors/missingstateerror');


/**
 * Complete state.
 *
 * This middleware is used to complete a stateful interaction.
 */
module.exports = function(dispatcher, store, options) {
  if (typeof options == 'string') {
    options = { name: options };
  }
  options = options || {};
  

  
  
  return function completeState(req, res, next) {
    req._stateTransitions = req._stateTransitions || 0;
    // TODO: Remove the function type check
    if (req.state && typeof req.state.complete == 'function') { req.state.complete(); }
    
    req._skipResumeError = true;
    
    return dispatcher._complete(options, null, req, res, next);
  };
};
