import { arrayToObject } from '../_helpers';

const dbVersion = 1;

const dataStructures = [
  {
    id: 'items',
    uri: 'rest/items?metadata=.*',
    key: 'name',
    onstart: true,
    label: 'Items'
  }
];

const dataStructuresObj = arrayToObject(dataStructures, 'id');

export { dbVersion, dataStructures, dataStructuresObj };
