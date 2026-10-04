export class CheckoutError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = 'INVALID_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
