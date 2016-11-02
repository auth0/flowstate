var flatten = require('utils-flatten');
var dispatch = require('./utils').dispatch;


function Manager(store) {
  this._flows = {};
  this._stt = {};
  this._store = store;
}

Manager.prototype.use = function(name, begin, resume) {
  begin = begin && flatten(Array.prototype.slice.call(begin, 0));
  resume = resume && flatten(Array.prototype.slice.call(resume, 0));
  
  this._flows[name] = {
    begin: begin,
    resume: resume
  };
}

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
  if (!flow.begin) { throw new Error("Cannot begin flow '" + name + "'"); }
  
  if (options) {
    req.locals = options;
  }
  dispatch(flow.begin)(null, req, res, next);
}

Manager.prototype.loadState = function(options) {
  return require('./middleware/load')(this._store, options);
};

Manager.prototype.resume = function(options) {
  return require('./middleware/resume')(this, this._store, options);
};

Manager.prototype.resumeError =
Manager.prototype.resumeErrorHandler =function(options) {
  return require('./middleware/resumeError')(this, this._store, options);
};

Manager.prototype._resume = function(name, err, req, res, next) {
  var flow = this._flows[name];
  if (!flow) { throw new Error("Cannot find flow '" + name + "'"); }
  if (!flow.resume) { throw new Error("Cannot resume flow '" + name + "'"); }
  
  dispatch(flow.resume)(err, req, res, next);
}

Manager.prototype._transition = function(name, from, err, req, res, next) {
  var trans = this._stt[name + '|' + from];
  if (!trans) { return next(err); }
  
  dispatch(trans)(err, req, res, next);
}


module.exports = Manager;
