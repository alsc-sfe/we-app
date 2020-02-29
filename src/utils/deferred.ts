enum Status {
  RESOLVED,
  REJECTED,
}

export default class Deferred<T> {
  promise: Promise<T>;

  resolve!: (value?: T | PromiseLike<T>) => void;

  reject!: (reason?: any) => void;

  private status: Status;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (value?: T | PromiseLike<T>) => {
        this.status = Status.RESOLVED;
        resolve(value);
      };
      this.reject = (reason?: any) => {
        this.status = Status.REJECTED;
        reject(reason);
      };
    });
  }

  finished() {
    return [Status.RESOLVED, Status.REJECTED].indexOf(this.status) > -1;
  }
}
