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

featureDetection_fetch();
featureDetection_worker();

var store = new StorageConnector();

store.addEventListener('connectionEstablished', event => {
  console.log(event);
  store
    .get('items', 'FF_Office_Dimmer_Spotlights')
    .then(result => {
      console.log(`Attempt #1`, result);
    })
    .catch(error => {
      console.log(error);
    });
});

// store
//   .get('items')
//   .then(result => {
//     console.log(`Attempt #2`, result);
//   })
//   .catch(error => {
//     console.log(error);
//   });

// store
//   .get('items')
//   .then(result => {
//     console.log(`Attempt #3`, result);
//   })
//   .catch(error => {
//     console.log(error);
//   });

// setTimeout(() => {
//   console.log(store.queue);
// }, 5000);
// store.addEventListener('connect', event => {
//   console.log('connect', event);
// });

// store.addEventListener('message', event => {
//   console.log('message', event);
// });

// store.addEventListener('connectionEstablished', event => {
//   console.log('connectionEstablished', event);
// });

// store.addEventListener('storeItemRemoved', event => {
//   console.log('storeItemRemoved!', event);
// });

// store.test();
