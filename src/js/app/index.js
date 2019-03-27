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
import { StateWhileRevalidateStore } from '../storage';

featureDetection_fetch();
featureDetection_worker();

const ff = new StateWhileRevalidateStore();

ff.connect('rancher.home.besqua.red', 18080);

// const ff = new StateWhileRevalidateStore();
// const jsonData = customFetch('http://rancher.home.besqua.red:18080/rest/items').then(jsonData => ff.initData('items', jsonData));

// setTimeout(() => {
//   const jsonData2 = customFetch('http://rancher.home.besqua.red:18080/rest/items').then(jsonData => ff.refreshData('items', jsonData));
// }, 10000);

// ff.addEventListener('storeItemChanged', event => {
//   console.log(event);
// });
// // customFetch('http://rancher.home.besqua.red:18080/rest/items');
