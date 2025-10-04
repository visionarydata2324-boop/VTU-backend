export interface DataPayload {
    network: number;
    mobile_number: string,
    plan: number,
    Ported_number?: boolean,
    ident: string,
    user?: {
        [key: string]: any
    }
}

export interface MTN_PLAN {
    SME: Array<Object>;
    SME2: Array<Object>;
    GIFTING: Array<Object>;
    CORPORATE: Array<Object>;
}


export interface AIRTEL_PLAN {
    SME: Array<Object>;
    SME2: Array<Object>;
    GIFTING: Array<Object>;
    CORPORATE: Array<Object>;
}

export interface FindDataPayload {
    plan_type: string;
    phone_number: number;
    plan_network: string;
    plan: string
}

export interface FindDataRespose {
    
        id: number,
        dataplan_id: string,
        network: string,
        plan_type: string,
        plan_network: string,
        month_validate: string,
        plan: string,
        plan_amount: string
    
}