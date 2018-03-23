var uri = require('url')
  , loadState = require('./load')
  , finishState = require('./complete')
  , failState = require('./completeError')
  , onRedirect = require('../utils/on-redirect')
  , onRender = require('../utils/on-render')
  , State = require('../state')
  , crc = require('crc').crc32;




module.exports = function(dispatcher, store, name, _rest) {
  var options = {}
    , completeState, completeErrorState;
  
  var fns = Array.prototype.slice.call(arguments, 3);
  if (typeof fns[fns.length - 1] == 'object') {
    options = fns.pop();
  }
  options.name = name;
  
  if (options.external) {
    fns.unshift(initialize);
  } else {
    completeState = finishState(dispatcher, store, options);
    completeErrorState = failState(dispatcher, store, options);
    
    fns.unshift(loadState(store, options));
    fns.unshift(initialize);
    fns.push(completeState);
    fns.push(completeErrorState);
  }
  
  
  
  
  function initialize(req, res, next) {
    //console.log('FLOWSTATE INIT!');
    //req.state = req.state || { name: name };
    
    req.state = req.state || new State(req, { name: name });
    
    
    
    
    
    onRedirect(res, function autoState(url, cb) {
      console.log('!! res.redirect ^ autoState');
      console.log(url);
      console.log(req.state);
      //console.log(this.req.state)
      //console.log(req.session.state);
      //console.log('complete? ' + req._stateComplete)
      
      var save = req.state.isDirty();
      if (!save) { return cb(); }
      
      if (req._stateComplete) { return cb(); }
      
      
      var loc = uri.parse(url, true);
      if (loc.query && loc.query.state) {
        return cb();
      }
      
      store.save(req, req.state, function(err, h) {
        //console.log('PERSISTED STATE');
        //console.log(err)
        //console.log(h);
        //console.log(req.session.state);
        
        
        var loc = uri.parse(url, true);
        //console.log(loc)
        delete loc.search;
        loc.query.state = h;
        //console.log(loc);
        
        cb(null, uri.format(loc));
      });
    });
    
    onRender(res, function autoState(cb) {
      console.log('!! res.render ^ autoState');
      console.log(this.req.state)
      console.log(this.req.query)
      
      //console.log('AUTO STATE RENDER!');
      //console.log(req.state);
      //console.log(req._state)
      //console.log(req.query);
      
      var save = req.state.isDirty();
      if (!save && ((req.query && req.query.state) || (req.body && req.body.state))) {
        res.locals.state = (req.query && req.query.state) || (req.body && req.body.state);
      }
      
      /*
      if (!req.state && ((req.query && req.query.state) || (req.body && req.body.state))) {
        res.locals.state = (req.query && req.query.state) || (req.body && req.body.state);
        return cb();
      }
      */
      
      cb();
    });
    
    
    // proxy redirect, and append state.  unless there's already a state query param
    
    res.prompt = function prompt(name, options) {
      console.log('!! res.prompt: ' + name);
      console.log(req.state);
      
      //console.log('PROMPT> ' + name);
      //console.log(req.session);
      //console.log(req.session.state);
      
      options = options || {};
      
      
      //console.log('>>> PROMPT: ' + name);
      //console.log(options)
      //console.log(req.state);
      //console.log(req.oauth2)
      
      req._stateComplete = false;
      
      
      function proceed(err) {
        dispatcher.goto(name, options, req, res, function(err) {
          // TODO: Implement this
          //console.log('ERROR?')
          //console.log(err);
        });
      }
      
      var save = req.state.isDirty();
      if (!save) {
        return proceed();
      }
      
      store.save(req, req.state, function(err, h) {
        //console.log('PERSISTED STATE');
        //console.log(err)
        //console.log(h);
        //console.log(req.session.state);
        
        req.state = new State(req, { name: name, prev: h });
        //req.state.prev = h;
        options.state = h;
      
        proceed();
      });
    };
    
    res.completePrompt = function resumeState(err, next) {
      var url;
      
      if (typeof err == 'function' || typeof err == 'string') {
        next = err;
        err = null;
      }
      if (typeof next == 'string') {
        url = next;
        // Q: Why doesn't this take an req, res, next?
        next = function(err) {
          //console.log('CAN REDIRECT TO');
          //console.log(req)
          //console.log(res);
          //console.log(url);
          
          
          // TODO: Need to not include state when this happens
          res.redirect(url);
        }
      }
      
      
      //console.log("RESUME?!");
      //console.log(req.state)
      
      req._stateComplete = true;
      
      req.__finishedTask = true;
      
      //delete req.state.prev
      
      if (err) {
        return completeErrorState(err, req, res, next);
      }
      return completeState(req, res, next)
    };
    
    next();
  };
  
  return fns;
};
