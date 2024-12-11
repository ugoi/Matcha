export enum ErrorStatus {
  Fail = "fail",
  Error = "error",
}

export class JFail extends Error {
  status: ErrorStatus;
  data: Object;

  constructor(data?: Object) {
    super();
    this.status = ErrorStatus.Fail;
    this.data = data;
  }
}

export class JError extends Error {
  status: ErrorStatus;
  data: Object;
  code: string

  constructor(message?: string, data?: Object, code?: string) {
    super(message);
    this.status = ErrorStatus.Error;
    this.data = data;
    this.code = code;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}
