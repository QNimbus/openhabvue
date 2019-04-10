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
import { StorageConnector } from './Store';
import { StaleWhileRevalidateStore } from '../storage/StaleWhileRevalidateStore';

featureDetection_fetch();
featureDetection_worker();

const store = new StaleWhileRevalidateStore();

store.addEventListener('connecting', event => {
  console.log(`connecting...`);
  console.debug(event);
});

store.addEventListener('connectionEstablished', event => {
  console.log(`connectionEstablished...`);
  console.debug(event);
});

store.addEventListener('connectionLost', event => {
  console.log(`connectionLost...`);
  console.debug(event);
});

store.connect('rancher.home.besqua.red', 18080).catch((error) => {

});

// try {
//   store.connect('rancher.home.besqua.red', 1800);
// } catch (error) {

// }

export { store };
