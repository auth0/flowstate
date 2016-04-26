var uid = require('uid-safe').sync;


function SessionStore(options) {
  options = options || {};
  
  this._key = options.key || 'state';
}

SessionStore.prototype.all = function(req, cb) {
  var key = this._key;
  if (!req.session || !req.session[key]) {
    return cb();
  }
  
  var obj = req.session[key];
  var arr = []
    , handles = Object.keys(obj)
    , state, h, i, len;
  for (i = 0, len = handles.length; i < len; ++i) {
    h = handles[i];
    state = req.session[key][h];
    // TODO: clone this?
    state.handle = h;
    arr.push(state);
  }
  
  return cb(null, arr);
}

SessionStore.prototype.load = function(req, h, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }

  var state = req.session[key][h];
  // TODO: clone this?
  state.handle = h;
  
  if (options.destroy === true) {
    this.destroy(req, h, function(){});
    return cb(null, state);
  } else {
    return cb(null, state);
  }
}

SessionStore.prototype.save = function(req, state, cb) {
  state.initiatedAt = Date.now();
  
  if (req.state && req.state.handle) {
    state.prev = req.state.handle;
  }
  
  var key = this._key;
  var h = uid(24);
  req.session[key] = req.session[key] || {};
  req.session[key][h] = state;
  return cb(null, h);
}

SessionStore.prototype.destroy = function(req, h, cb) {
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }
  
  delete req.session[key][h];
  if (Object.keys(req.session[key]).length == 0) {
    delete req.session[key];
  }
  return cb();
}


module.exports = SessionStore;