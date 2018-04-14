var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , completeStateError = require('../../lib/middleware/completeError');


/*
describe('middleware/completeError', function() {
  
  describe('attempting to resume parent state from state and proceeding to default behavior', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(err); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2 };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // attempting to resume parent state from state and proceeding to default behavior
  
  describe('attempting to resume parent state from unloaded named state and proceeding to default behavior', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(err); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { handle: '22345678', name: 'bar', y: 2 });
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store, { name: 'bar' }))
        .req(function(req) {
          request = req;
          req.query = { state: '22345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        //handle: '22345678',
        name: 'bar',
        y: 2
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // attempting to resume parent state from unloaded named state and proceeding to default behavior
  
  describe('attempting to resume parent state without state', function() {
    var dispatcher = {
      _dispatch: function(){}
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // attempting to resume parent state without state
  
  describe('attempting to resume parent state which is not found', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(err); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // attempting to resume parent state which is not found
  
  describe('attempting to resume parent state from unloaded state which is not found', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(err); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          req.query = { state: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.undefined
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // attempting to resume parent state from unloaded state which is not found
  
  describe('encountering an error destroying state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'foo', x: 1 });
      sinon.stub(store, 'destroy').yields(new Error('something went wrong destroying state'));
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  });
  
  describe('encountering an error loading parent state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(new Error('something went wrong loading state'));
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // encountering an error loading parent state
  
  describe('encountering an error resuming unnamed parent state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(new Error("Cannot dispatch to unnamed state")); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { x: 1 });
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('Cannot dispatch to unnamed state');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        x: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.have.been.calledOnce;
      var call = dispatcher._dispatch.getCall(0);
      expect(call.args[0]).to.be.undefined;
      expect(call.args[1]).to.be.undefined;
      expect(call.args[2]).to.be.undefined;
      expect(call.args[3]).to.be.an.instanceOf(Error);
      expect(call.args[3].message).to.equal('something went wrong');
    });
  }); // encountering an error resuming unnamed parent state
  
  describe('encountering an error resuming unloaded unnamed parent state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(new Error("Cannot dispatch to unnamed state")); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { x: 1 });
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          req.query = { state: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('Cannot dispatch to unnamed state');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        x: 1
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.have.been.calledOnce;
      var call = dispatcher._dispatch.getCall(0);
      expect(call.args[0]).to.be.undefined;
      expect(call.args[1]).to.be.undefined;
      expect(call.args[2]).to.be.undefined;
      expect(call.args[3]).to.be.an.instanceOf(Error);
      expect(call.args[3].message).to.equal('something went wrong');
    });
  }); // encountering an error resuming unloaded unnamed parent state
  
  describe('handling an error encountered when resuming parent state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { x: 1 });
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          req.state = { name: 'foo', x: 1 };
          req.yieldState = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
          req._skipResumeError = true;
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong while resuming parent state'));
    });
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong while resuming parent state');
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should preserve yield state', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // handling an error encountered when resuming a parent state
  
});
*/
