import * as SibApiV3Sdk from '@sendinblue/client';
import { configDotenv } from 'dotenv';

configDotenv();

const apiInstance = new SibApiV3Sdk.AccountApi();

describe('Account API', () => {
  it('should call getAccount and return account data', async () => {
    const mockData = { id: 1, name: 'Test Account' };

    // Mock the getAccount method
    jest.spyOn(apiInstance, 'getAccount').mockResolvedValue({ body: mockData });

    const result = await apiInstance.getAccount();
    
    expect(result.body).toEqual(mockData);
  });
});
