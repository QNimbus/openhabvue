export class CustomException extends Error {
  constructor(message, ...metadata) {
    super(message);
    this.metadata = metadata;
  }
}

export class NotSupportedException extends CustomException {
  constructor(message, ...metadata) {
    super(message, metadata);
  }
}

export class FetchException extends CustomException {
  constructor(message, ...metadata) {
    super(message, metadata);

    const [status] = metadata;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchException);
    }
    this.message = message;
    this.status = status;
  }
  networkErrorMessage() {
    return this.message + ' (' + this.status + ')';
  }
  toString() {
    return this.message + ' (' + this.status + ')';
  }
}
