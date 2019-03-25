export function NotSupportedException(message, metadata) {
  const error = new Error(message);
  error.metadata = metadata;
  return error;
}

NotSupportedException.prototype = Object.create(Error.prototype);

export function featureDetection_fetch() {
  if (!window.fetch) {
    throw NotSupportedException(`'window.fetch' method is not supported in this browser`);
  }
}
