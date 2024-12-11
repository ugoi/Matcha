export class SuccessResponse {
  status: "success" = "success";
  data: object | null;

  constructor(data: object | null) {
    this.data = data;
  }
}

export class FailResponse {
  status: "fail" = "fail";
  data: object | null;

    constructor(data: object | null) {
        this.data = data;
    }
}

export class ErrorResponse {
  status: "error" = "error";
  message: string;
  data: object | null;

    constructor(message: string, data: object | null) {
        this.message = message;
        this.data = data;
    }
}
