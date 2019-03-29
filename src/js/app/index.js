/**
 * TODO: Summary. (use period)
 *
 * TODO: Description. (use period)
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/storage/index.js
 * @file   This files defines the MyClass class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

// Local imports
import { featureDetection_fetch, featureDetection_worker } from '../_helpers';
import { StorageConnector } from './store';

featureDetection_fetch();
featureDetection_worker();

var store = new StorageConnector();

store.addEventListener('connectionEstablished', event => {
  console.log('connectionEstablished');
  store.postMessage('Test!');
});

store.addEventListener('storeItemRemoved', event => {
  console.log('storeItemRemoved!');
});

// store.test();
