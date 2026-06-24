declare module "midtrans-client" {
  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }

  interface ItemDetail {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  interface ExpiryOptions {
    unit: "minute" | "hour" | "hours" | "day";
    duration: number;
  }

  interface SnapTransactionParam {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetail[];
    expiry?: ExpiryOptions;
    [key: string]: unknown;
  }

  interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
  }

  interface CoreApiTransactionParam {
    transaction_details: TransactionDetails;
    payment_type: string;
    customer_details?: CustomerDetails;
    item_details?: ItemDetail[];
    [key: string]: unknown;
  }

  interface StatusResponse {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    payment_type?: string;
    gross_amount?: string;
    [key: string]: unknown;
  }

  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  class Snap {
    constructor(config: MidtransConfig);
    createTransaction(param: SnapTransactionParam): Promise<SnapTransactionResponse>;
    createTransactionToken(param: SnapTransactionParam): Promise<string>;
    createTransactionRedirectUrl(param: SnapTransactionParam): Promise<string>;
  }

  class CoreApi {
    constructor(config: MidtransConfig);
    charge(param: CoreApiTransactionParam): Promise<StatusResponse>;
    capture(orderId: string): Promise<StatusResponse>;
    approve(orderId: string): Promise<StatusResponse>;
    deny(orderId: string): Promise<StatusResponse>;
    cancel(orderId: string): Promise<StatusResponse>;
    refund(orderId: string, param?: Record<string, unknown>): Promise<StatusResponse>;
    transaction: {
      status(orderId: string): Promise<StatusResponse>;
      statusB2b(orderId: string): Promise<StatusResponse>;
      expire(orderId: string): Promise<StatusResponse>;
    };
  }

  export { Snap, CoreApi };
  export default { Snap, CoreApi };
}
