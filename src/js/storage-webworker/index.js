import { customFetch } from '../_helpers';

const jsonData = customFetch('http://rancher.home.besqua.red:18080/rest/items').then(jsonData => {
  self.postMessage(jsonData);
});

//self.close();
