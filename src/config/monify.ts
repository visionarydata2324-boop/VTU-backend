import { config } from 'dotenv';

config()

export const MONIFY_CONFIG = {
baseUrl:process.env.MONNIFY_BASE_URL as string,
apiKey: process.env.MONNIFY_API_KEY as string,
secretKey: process.env.MONNIFY_SECRET_KEY as string,
contractCode:process.env.MONNIFY_CONTRACT_CODE as string,
defaultRedirectUrl: process.env.MONIFY_DEFAULT_REDIRECT as string,
enabledPaymentMethod: [
    "ACCOUNT_TRANSFER",
    "CARD"
],
}

