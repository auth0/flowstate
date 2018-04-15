var flatten = require('utils-flatten');
var dispatch = require('./utils').dispatch;
var SessionStore = require('./stores/session');
var State = require('./state');
var MissingStateError = require('./errors/missingstateerror')
  , debug = require('debug')('flowstate');


function Manager(options, store) {
  if (!store) { store = new SessionStore(options); }
  
  this._flows = {};
  this._stt = {};
  this._store = store;
}

Manager.prototype.use = function(name, begin, resume, finish) {
  begin = begin && flatten(Array.prototype.slice.call(begin, 0));
  resume = resume && flatten(Array.prototype.slice.call(resume, 0));
  finish = finish && flatten(Array.prototype.slice.call(finish, 0));
  
  this._flows[name] = {
    begin: begin,
    resume: resume,
    finish: finish
  };
}

Manager.prototype.yield = 
Manager.prototype.transition = function(name, from, trans) {
  if (!Array.isArray(trans)) {
    trans = [ trans ];
  }
  
  trans = trans && flatten(Array.prototype.slice.call(trans, 0));
  this._stt[name + '|' + from] = trans;
}

Manager.prototype.goto = function(name, options, req, res, next) {
  if (typeof next !== 'function') {
    next = res;
    res = req;
    req = options;
    options = undefined;
  }
  
  var flow = this._flows[name];
  if (!flow) { throw new Error("Cannot find flow '" + name + "'"); }
  //if (!flow) { return next(new Error("Cannot find flow '" + name + "'")); }
  if (!flow.begin) { throw new Error("Cannot begin flow '" + name + "'"); }
  
  if (options) {
    req.locals = options;
  }
  dispatch(flow.begin)(null, req, res, next);
}

Manager.prototype.flow = function(name, options) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(this._store);
  args.unshift(this);
  
  return require('./middleware/flow').apply(null, args);
};

Manager.prototype._resume = function(name, err, req, res, next) {
  var flow = this._flows[name];
  if (!flow) { return next(new Error("Cannot find flow '" + name + "'")); }
  if (!flow.resume) { return next(new Error("Cannot resume flow '" + name + "'")); }
  
  // TODO: Allow for options here?
  var comp = require('./middleware/complete')(this, this._store, {});
  var compErr = require('./middleware/completeError')(this, this._store, {});
  
  var arr = flow.resume.concat([comp, compErr]);
  if (flow.finish) {
    arr = arr.concat(flow.finish)
  }
  
  dispatch(arr)(err, req, res, next);
}

Manager.prototype._transition = function(name, from, err, req, res, next) {
  var trans = this._stt[name + '|' + from];
  if (!trans) { return next(err); }
  
  dispatch(trans)(err, req, res, next);
}

Manager.prototype._through = function(through, err, req, res, next) {
  req.yieldState = req.state;
  req.state = new State(req, { name: through }, undefined, false, true);
  return this._dispatch(through, req.yieldState.name, null, err, req, res, next);
}

Manager.prototype._dispatch = function(name, from, through, err, req, res, next) {
  if (!name) { return next(new Error("Cannot resume unnamed flow")); }
  
  //console.log('$ dispatch');
  //console.log(name + ' <- ' + from);
  //console.log('through: ' + through)
  //console.log(req.state);
  //console.log(req.yieldState);
  //console.log('----------');
  
  var fname = req._stateTransitions === 0 ? (from || (req.yieldState && req.yieldState.name)) : (req.yieldState && req.yieldState.name);
  var tname = req._stateTransitions === 0 ? through : undefined;
  
  if (tname && tname !== req.state.name) {
    req._state = req.state;
    req.state = new State(req, { name: tname }, undefined, false, true);
    req.state.parent = req._state.handle;
    return this._dispatch(tname, from, null, err, req, res, next);
  }
  
  req._stateTransitions++;
  
  debug('resume %O (handle: %s) yielding %O', req.state, req.state.handle, req.yieldState);
  
  
  
  var self = this;
  
  function cont(err) {
    // TODO: Test case for transition error
    self._resume(name, err, req, res, next);
  }
  
  if (fname) {
    // TODO: Make sure transition errors get plumbed through correctly
    this._transition(name, fname, err, req, res, cont);
  } else {
    cont(err);
  }
}


Manager.prototype._complete = function(options, err, req, res, next) {
  var self = this
    , store = this._store
  
  var from = options.name
    , through = options.through
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  debug('complete %O (handle: %s)', req.state, req.state.handle);
  
  
  function dispatch(name) {
    return self._dispatch(name, from, through, err, req, res, next);
  }
  
  function proceed(h, ystate) {
    if (!h) {
      // TODO: Clean this up
      if (through && ystate) {
        return self._through(through, err, req, res, next);
      }
      
      // No state to resume.  `next` middleware is expected to implement
      // default behavior for responding to the request.
      return next(err);
    }
    
    store.load(req, h, function(ierr, state) {
      //err = new Error('wtf')
      //err.state = state
      
      if (ierr) { return err ? next(err) : next(ierr); }
      if (!state) {
        if (err) { return next(err); }
        
        return (ystate)
          ? next(new MissingStateError("Failed to load previous state", h))
          : next(new MissingStateError("Failed to load state", h));
      }
      
      req.state = new State(req, state, h);
      
      // Expose the state that is yeilding control back to the previous state.
      // When the previous state is resumed, it can use this context to inform
      // its behavior.
      req.yieldState = ystate;
      
      dispatch(state.name);
    });
  }
  
  if (req._state) {
    // The state to be resumed has been loaded in an optimized manner.  Dispatch
    // directly to the state, yielding the current state, avoiding any
    // unnecessary operations against the state store.  Specifically, the state
    // being resumed is already loaded and the yeilding state is not persisted
    // and therefore does not need to be destroyed.
    req.yieldState = req.state;
    req.state = req._state;
    delete req._state;
    return dispatch(req.state.name);
  } else {
    // The current state is complete, and is yiedling to its parent state, if
    // any.
    if (req.state.isSynthentic()) {
      // The current state is a synthetic state, meaning another state has been
      // resumed through this state.  Synthetic states are not persisted and
      // therefore do not need to be destroyed.  Resume the parent state.
      return proceed(req.state.parent, req.state);
    } else if (req.state.isNew()) {
      // The current state is a new state, and is not persisted and therefore
      // does not need to be destroyed.  Resume the parent state, as indicated
      // by the state parameter carried in the request.
      return proceed(getHandle(req), req.state);
    } else {
      if (req.state.isKeeped() && req.state.isModified()) {
        req.state.save(function(err) {
          // TODO: error handling
          return proceed(req.state.parent, req.state);
        });
        return;
      } else if (req.state.isKeeped()) {
        return proceed(req.state.parent, req.state);
      }
    
      // Remove the current state from any persistent storage, due to the
      // fact that it is complete.  Proceed to load the parent state (if any)
      // and resume processing.
      req.state.destroy(function(ierr) {
        if (ierr) { return err ? next(err) : next(ierr); }
        return proceed(req.state.parent, req.state);
      });
    }
  }
}


module.exports = Manager;
