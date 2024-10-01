export enum ErrorStatus {
  Fail = "fail",
  Error = "error",
}

export class JFail extends Error {
  status: ErrorStatus;
  data: Object;
  errorMessage: string;

  constructor(data: Object, message?: string) {
    super(message);
    this.name = "JFail";
    this.status = ErrorStatus.Fail;
    this.data = data;
  }
}

export class JError extends Error {
  status: ErrorStatus;
  data: Object;

  constructor(message: string, data?: Object) {
    super(message);
    this.name = "JError";
    this.status = ErrorStatus.Error;
    this.data = data || null;
  }
}
