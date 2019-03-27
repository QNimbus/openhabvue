import { NotSupportedException } from './customExceptions';

export function featureDetection_fetch() {
  if (!window.fetch) {
    throw new NotSupportedException(`'window.fetch' method is not supported in this browser`);
  }
}

export function featureDetection_worker() {
  if (!window.Worker) {
    throw new NotSupportedException(`'window.worker' method is not supported in this browser`);
  }
}
