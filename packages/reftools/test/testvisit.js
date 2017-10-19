const util = require('util');

const should = require('should');
const visit = require('../lib/visit.js').visit;
const clone = require('../lib/clone.js').clone;

const original = JSON.parse(`
{
  "usage": {
    "one": {
      "$ref": "#/definitions/shared"
    },
    "two": {
      "$ref": "#/definitions/shared"
    }
  },
  "definitions": {
    "shared": {
      "container": "value"
    }
  }
}
`);
let input = clone(original);

// TODO mutating

describe('visit',function(){
    describe('simple',function(){
        it('should traverse a simple object',function(){
            let calls = [];

            visit(input,{},{
                filter: function(obj,key,state){
                    calls.push(obj[key]);
                    return obj[key];
                }
            });

            calls.should.be.an.Array();
            should(calls.length).be.exactly(8);

        });
        it('should filter a simple object',function(){
            let calls = [];

            visit(input,{},{
                filter: function(obj,key,state){
                    calls.push(obj[key]);
                    if (key !== 'usage') {
                        return obj[key];
                    }
                }
            });

            calls.should.be.an.Array();
            should(calls.length).be.exactly(4);

            input.should.not.deepEqual(original);

        });
        it('should compare a simple object',function(){
            visit(original,original,{
                compare: function(obj,key,state,comp) {
                    obj[key].should.equal(comp);
                    return obj[key];
                }
            });

        });
        it('should detect object identity',function(){

            input.usage = {};
            input.usage.one = { hello: 'exactly' };
            input.usage.two = input.usage.one;
            input.definitions.shared = input.usage.one;

            let calls = [];

            visit(input,{},{
                identity: function(obj,key,state,identityPath) {
                    calls.push(identityPath);
                }
            });

            should(calls.length).be.exactly(2);
            calls[0].should.be.equal('#/usage/one');
            calls[1].should.be.equal('#/usage/one');
        });
        it('should initially call before',function(){
            let called = false;
            let selectedCalled = false;
            let selectedCalledFirst = false;
            visit(original,{},{
                before: function(obj,key,state){
                    called = true;
                    if (selectedCalled) selectedCalledFirst = true;
                    obj.should.equal(original);
                    key.should.equal('');
                },
                selected: function(obj,key,state){
                   selectedCalled = true;
                }
            });
            called.should.be.exactly(true);
            selectedCalled.should.be.exactly(true);
            selectedCalledFirst.should.be.exactly(false);
        });
        it('should call finally at the end',function(){
            let called = false;
            let selectedCalled = false;
            let selectedCalledFirst = false;
            visit(original,{},{
                selected: function(obj,key,state){
                    selectedCalled = true;
                    if (called === false) selectedCalledFirst = true;
                },
                finally: function(obj,key,state){
                    called = true;
                    obj.should.equal(original);
                    key.should.equal('');
                }
            });
            called.should.be.exactly(true);
            selectedCalled.should.be.exactly(true);
            selectedCalledFirst.should.be.exactly(true);
        });
    });
});
