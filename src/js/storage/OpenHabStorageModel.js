/**
 * TODO: Summary. (use period)
 *
 * TODO: Description. (use period)
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/storage/openHabStorageModel.js
 * @file   This files defines the MyClass class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

// Local imports
import { arrayToObject } from '../_helpers';

const dbVersion = 3;

const dataStructures = [
  // { id: 'bindings', uri: 'rest/bindings', key: 'id', onstart: true, label: 'Bindings' },
  { id: 'items', uri: 'rest/items?metadata=.*', allowSingleItem: true, key: 'name', onstart: true, label: 'Items' },
  // { id: 'things', uri: 'rest/things', key: 'UID', onstart: true, label: 'Things' },
];

const dataStructuresObj = arrayToObject(dataStructures, 'id');

export { dbVersion, dataStructures, dataStructuresObj };
