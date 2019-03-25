import { StateWhileRevalidateStore, customFetch } from '../storage';

const ff = new StateWhileRevalidateStore();
const jsonData = customFetch(
  'http://rancher.home.besqua.red:18080/rest/items'
).then(jsonData => ff.initData('items', jsonData));

setTimeout(() => {
  const jsonData2 = customFetch(
    'http://rancher.home.besqua.red:18080/rest/items'
  ).then(jsonData => ff.refreshData('items', jsonData));
}, 10000);

ff.addEventListener('storeItemChanged', event => {
  console.log(event);
});
// customFetch('http://rancher.home.besqua.red:18080/rest/items');
