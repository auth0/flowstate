var Meta = module.exports = function Meta(options) {
  this.originalHash = null;
  this.savedHash = null;
  this.required = false;
  this.complete = false;
}


Meta.prototype = {
  
  toJSON: function() {
    return;
  }
  
};
