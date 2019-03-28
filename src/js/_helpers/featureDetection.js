import { NotSupportedException } from './customExceptions';

export function featureDetection_fetch() {
  if (!window.fetch) {
    throw new NotSupportedException(`'window.fetch' method is not supported in this browser`);
  }
}

export function featureDetection_worker() {
  if (!window.Worker || !window.SharedWorker) {
    throw new NotSupportedException(`'window.Worker' or 'window.SharedWorker' method(s) are not supported in this browser`);
  }
}
