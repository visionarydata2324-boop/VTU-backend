import { gSubzAirtime } from '../src/services/airtime/Gsubz_airtime';
import { GSubzAirtimePayload } from '../src/utils/types/gsubz_service_Enums';
import axios from 'axios';

// Mocks
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GSubzAirtime Service', () => {
  let oldEnv: NodeJS.ProcessEnv;
  let mockPost: jest.Mock;
  let mockAxiosInstance: any;

  beforeAll(() => {
    oldEnv = { ...process.env };
    process.env.GSUBZ_AUTH_TOKEN = 'testtoken';
    process.env.GSUBZ_BASE_URL = 'http://gsubz.api';
  });

  beforeEach(() => {
    mockPost = jest.fn();
    mockAxiosInstance = { post: mockPost };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.warn as jest.MockedFunction<any>).mockRestore();
    (console.log as jest.MockedFunction<any>).mockRestore();
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  it('should create a unique request ID with 6 digits', () => {
    const requestId = gSubzAirtime.generateRequestId();
    expect(requestId).toMatch(/^\d{6}$/);
  });

  it('should generate a unique ID with correct Airtime prefix', () => {
    const uniqueID = gSubzAirtime.createUniqueID();
    expect(uniqueID.startsWith('Airtime')).toBe(true);
    expect(uniqueID.length).toBeGreaterThan('Airtime'.length);
  });

  it('should send correct payload and headers in purchaseAirtime', async () => {
    mockPost.mockResolvedValueOnce({ data: { status: 'OK', result: 'success' } });
    const spy = jest.spyOn(mockAxiosInstance, 'post');
    await gSubzAirtime.purchaseAirtime('08012345678', '500', 'MTN');
    expect(spy).toHaveBeenCalledWith(
      '/api/pay/',
      expect.objectContaining({
        phone: '08012345678',
        amount: '500',
        serviceID: 'mtn', // lowercase
        api: 'testtoken',
      }),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
  });

  it('should return the API response data on a successful airtime purchase', async () => {
    const apiData = { status: 'OK', transaction: { id: 99 } };
    mockPost.mockResolvedValueOnce({ data: apiData });
    const result = await gSubzAirtime.purchaseAirtime('08012345678', '500', 'GLO');
    expect(result).toEqual(apiData);
  });

  it('should log a warning if purchase request fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));
    const result = await gSubzAirtime.purchaseAirtime('08011223344', '400', 'AIRTEL');
    expect(console.warn).toHaveBeenCalledWith('Purchase request error:', 'Network error');
    expect(result).toBeUndefined();
  });

  it('should convert serviceID to lowercase before sending', async () => {
    mockPost.mockResolvedValueOnce({ data: { status: 'OK' } });
    await gSubzAirtime.purchaseAirtime('08011223344', '1000', 'ETISALAT');
    expect(mockPost).toHaveBeenCalledWith(
      '/api/pay/',
      expect.objectContaining({ serviceID: 'etisalat' }),
      expect.anything()
    );
  });

  it('should return success and normalized data on successful transaction verification', async () => {
    mockPost.mockResolvedValueOnce({ data: { status: 'TRANSACTION_SUCCESSFUL', result: 'ok' } });
    const result = await gSubzAirtime.verifyTransaction('req1234');
    expect(result).toEqual({ success: true, data: { status: 'TRANSACTION_SUCCESSFUL', result: 'ok' } });
  });

  it('should return failure object if verification status not TRANSACTION_SUCCESSFUL', async () => {
    mockPost.mockResolvedValueOnce({ data: { status: 'FAILED', reason: 'insufficient' } });
    const result = await gSubzAirtime.verifyTransaction('req5678');
    expect(result).toEqual({ success: false, data: { status: 'FAILED', reason: 'insufficient' } });
  });

  it('should throw an error if verification API call fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Invalid request'));
    await expect(gSubzAirtime.verifyTransaction('fail_001')).rejects.toThrow('Verification failed: Invalid request');
  });
});
