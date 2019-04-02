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

window.addEventListener('load', event => {
  console.log('EVENT: LOAD', event);
  document.getElementById('testID').start('-');
});

// store.addEventListener('connectionEstablished', event => {
//   store
//     .get('items')
//     .then(result => {
//       console.log(`Attempt #1`, result);
//     })
//     .catch(error => {
//       console.log(error);
//     });
// });

store.addEventListener('storeItemChanged', event => {
  if (event.detail.data.msg.value.name === 'FF_Office_Dimmer_Spotlights') {
    // console.log(event.detail.data.msg);
    document.getElementById('testID').updateContext(event.detail.data.msg.value.state);
  }
});
