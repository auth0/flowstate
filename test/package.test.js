/* global describe, it */

const flowstate = require('..');
const expect = require('chai').expect;


describe('flowstate', function() {
  
  it('should export constructors', function() {
    expect(flowstate.Manager).to.be.a('function');
    expect(flowstate.SessionStore).to.be.a('function');
  });
  
  it('should export Error constructors', function() {
    expect(flowstate.ExpiredStateError).to.be.a('function');
    expect(flowstate.MissingStateError).to.be.a('function');
  });
  
});
