// import { StaleWhileRevalidateStore } from '../js/storage.js';
const StaleWhileRevalidateStore = require('../js/storage.js').StaleWhileRevalidateStore;

const ASYNC_TIMEOUT = 6000;

describe('StaleWhileRevalidateStore', _ => {
  const storeName = 'TestName';
  let store = new StaleWhileRevalidateStore(storeName);
  let eventSpy = sinon.spy();

  it(`should have name,  '${storeName}'`, function() {
    chai.expect(store.storeName).to.equal(storeName);
  });

  it(`should fire 'connecting' event`, function() {
    store.addEventListener('connecting', eventSpy);
    store.connect();

    chai.assert(eventSpy.called, 'Event did not fire.');
    chai.assert(eventSpy.calledOnce, 'Event fired more than once');
  });

  it(`should reject the promise for an invalid SSE endpoint`, done => {
    var testPromise = store.connect('nonexistinghost', 8080);

    testPromise.catch(function(e) {
      chai.expect(e.message).to.include('Failed to fetch');
      chai.expect(store.connected).to.be.false;
      done();
    });
  }).timeout(ASYNC_TIMEOUT);

  it(`should reject the promise for an invalid SSE port`, done => {
    var testPromise = store.connect('localhost', 12345);

    testPromise.catch(function(e) {
      chai.expect(e.message).to.include('Failed to fetch');
      chai.expect(store.connected).to.be.false;
      done();
    });
  }).timeout(ASYNC_TIMEOUT);

  it(`should contain a IndexDB database instance`, done => {
    store.connect().finally(_ => {
      chai.expect(store.db).to.be.an.instanceof(IDBDatabase);
      done();
    });
  }).timeout(ASYNC_TIMEOUT);
});
