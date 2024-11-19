export enum ErrorStatus {
  Fail = "fail",
  Error = "error",
}

export class JFail extends Error {
  status: ErrorStatus;
  data: Object;
  message: string;

  constructor(data?: Object, message?: string) {
    super(message);
    this.status = ErrorStatus.Fail;
    if (!data) {
      this.data = {message: message}
    }
    this.data = data;
    this.message = message;
  }
}

export class JError extends Error {
  status: ErrorStatus;
  message: string;
  data: Object;

  constructor(message: string, data?: Object) {
    super(message);
    this.status = ErrorStatus.Error;
    this.data = data;
    this.message = message;
  }
}
