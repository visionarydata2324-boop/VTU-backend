// express.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
   export interface UserRequest extends Request {
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: string;
        isVerified: boolean;
      };
    }
  }
}

declare global {
  namespace Express {
    export interface DataRequest extends UserRequest {
      data?: {
        id?: string;
        network: string;
        plan: string;
        duration: string;
      };
    }
  }
}

declare global {
  namespace Express {
  export  interface SELECTED_CONTROLLER extends Request{
    selectedController?:{
      findData: (req: Request, res: any) => Promise<void>;
      buyData: (req: Request, res: any) => Promise<void>;
      findGsubData:  (req: Request, res: any) => Promise<void>;
      buyGsubzData: (req: Request, res: any) => Promise<void>;
    }
  }
}
}
// Export the type for reuse
export type { UserRequest, DataRequest, SELECTED_CONTROLLER };