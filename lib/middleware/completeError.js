/**
 * Module dependencies.
 */
var ExpiredStateError = require('../errors/expiredstateerror');


/**
 * Complete state with error.
 *
 * This middleware is used to complete a stateful interaction with an error.
 */
module.exports = function(dispatcher, store, options) {
  if (typeof options == 'string') {
    options = { name: options };
  }
  options = options || {};
  
  var from = options.name
    , through = options.through
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  return function completeStateError(err, req, res, next) {
    if (req._skipResumeError) { return next(err); }
    
    req._stateTransitions = req._stateTransitions || 0;
    
    function dispatch(name) {
      return dispatcher._dispatch(name, from, through, err, req, res, next);
    }
    
    function proceed(h, ystate) {
      if (!h) {
        // No state to resume.  `next` middleware is expected to implement
        // default behavior for responding to the request.
        return next(err);
      }
      
      store.load(req, h, function(ierr, state) {
        if (ierr) { return next(err); }
        if (!state) { return next(err); }
        
        req.state = state;
        
        if (from && from === state.name) {
          // State has been loaded for the state that is the yeilding state, and
          // therefore needs finalizing and further resumption, if possible.
          return finalize(state);
        }
        
        if (through && through !== state.name  && !req.__throughTask) {
          //console.log('NEED TO DISPATH THROUGH: ' + through);
          //console.log('HOWEVER, WE HAVE');
          //console.log(state)
          
          req.yieldState = ystate;
          
          req._state = req.state;
          req.state = { name: through };
          req.state.prev = req._state.handle;
          
          req.__throughTask = true;
          
          return dispatch(through);
        }
        
        // Expose the state that is yeilding control back to the previous state.
        // When the previous state is resumed, it can use this context to inform
        // its behavior.
        req.yieldState = ystate;
        
        dispatch(state.name);
      });
    }
    
    function finalize(state) {
      // Remove the current state from any persistent storage, due to the
      // fact that it is complete.  Proceed to load the previous state (if any)
      // and resume processing.
      store.destroy(req, state.handle, function(ierr) {
        if (ierr) { return next(err); }
        
        // Don't try and load the previous state if it's antecedent removal was the cause
        // of the error that led to this processing in the first place.
        if (err instanceof ExpiredStateError && err.state.handle === state.prev) { return next(err); };
        
        return proceed(state.prev, state);
      });
    }
    
    
    // TODO: Deliberately unset the error flag
    
    console.log('@FAILED # ' + req._stateTransitions);
    console.log('  name: ' + (req.state ? req.state.name : 'unloaded'))
    
    if (req.state) {
      if (from && from !== req.state.name && !req.__finishedTask) {
        // State has been loaded for a state that is not the yeilding state, and
        // therefore is the state that is being resumed.
        return dispatch(req.state.name);
      }
      
      finalize(req.state);
    } else if (req._state) {
      // State has been loaded for a state that was not the expected (and
      // yielding) state, and therefore is the state that is being resumed.
      // This is an optimization, supported by a prior call to `loadState`
      // with a specified name option.
      req.state = req._state;
      delete req._state;
      return dispatch(req.state.name);
    } else {
      return proceed(getHandle(req));
    }
  };
};
