import axios from 'axios';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';

interface AuthTokenResponse {
  access_token: string;
  public_token: string;
  login_time: string;
}

class ZerodhaAuth {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string, baseUrl = 'https://api.kite.trade') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate login URL for OAuth authentication
   */
  getLoginUrl(): string {
    return `https://kite.zerodha.com/connect/login?api_key=${this.apiKey}`;
  }

  /**
   * Generate access token from request token
   */
  async generateAccessToken(requestToken: string): Promise<AuthTokenResponse> {
    try {
      const checksum = crypto
        .createHash('sha256')
        .update(this.apiKey + requestToken + this.apiSecret)
        .digest('hex');

      const formData = new URLSearchParams({
        api_key: this.apiKey,
        request_token: requestToken,
        checksum: checksum,
      });

      const response = await axios.post(
        `${this.baseUrl}/session/token`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        }
      );

      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(`Authentication failed: ${response.data.message}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to generate access token: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Interactive authentication flow
   */
  async interactiveAuth(): Promise<string> {
    console.log('\n🔐 Zerodha Authentication Required');
    console.log('=====================================');
    console.log('1. Open this URL in your browser:');
    console.log(`   ${this.getLoginUrl()}`);
    console.log('2. Complete the login process');
    console.log('3. Copy the request_token from the redirect URL');
    console.log('4. The URL will look like: https://your-redirect-url?request_token=XXXXXX&action=login&status=success');
    console.log('\nWaiting for request token...\n');

    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('Please paste the request_token here: ', async (requestToken: string) => {
        rl.close();
        
        if (!requestToken || requestToken.trim() === '') {
          reject(new Error('Request token is required'));
          return;
        }

        try {
          console.log('🔄 Generating access token...');
          const authResponse = await this.generateAccessToken(requestToken.trim());
          console.log('✅ Access token generated successfully!');
          resolve(authResponse.access_token);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

export async function validateAccessToken(
  apiKey: string,
  accessToken: string,
  baseUrl = 'https://api.kite.trade'
): Promise<boolean> {
  try {
    const response = await axios.get(`${baseUrl}/user/profile`, {
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': '3',
      },
      timeout: 10000,
    });

    return response.data.status === 'success';
  } catch (error) {
    return false;
  }
}

/**
 * Update .env file with new access token
 */
async function updateEnvFile(accessToken: string): Promise<void> {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (error) {
      // .env file doesn't exist, create a basic one
      envContent = `# Zerodha API Configuration
ZERODHA_API_KEY=your_api_key
ZERODHA_API_SECRET=your_api_secret
ZERODHA_ACCESS_TOKEN=your_access_token

# Optional: Request timeout in milliseconds
REQUEST_TIMEOUT=30000

# Optional: Base URL for Zerodha API
ZERODHA_BASE_URL=https://api.kite.trade
`;
    }

    // Update the access token line
    const updatedContent = envContent.replace(
      /ZERODHA_ACCESS_TOKEN=.*/,
      `ZERODHA_ACCESS_TOKEN=${accessToken}`
    );

    // Write back to file
    await fs.writeFile(envPath, updatedContent, 'utf-8');
    console.log('📝 Access token saved to .env file');
    
  } catch (error) {
    console.warn('⚠️  Could not update .env file:', error);
    console.log(`📝 Please manually update your .env file with: ZERODHA_ACCESS_TOKEN=${accessToken}`);
  }
}

export async function getValidAccessToken(
  apiKey: string,
  apiSecret: string,
  existingToken?: string
): Promise<string> {
  const auth = new ZerodhaAuth(apiKey, apiSecret);

  // If existing token is provided, validate it first
  if (existingToken && existingToken !== 'your_access_token') {
    console.log('🔍 Validating existing access token...');
    const isValid = await validateAccessToken(apiKey, existingToken);
    
    if (isValid) {
      console.log('✅ Existing access token is valid');
      return existingToken;
    } else {
      console.log('❌ Existing access token is invalid or expired');
    }
  }

  // Token is missing or invalid, need new one
  console.log('🔄 Access token required. Starting authentication flow...');
  
  try {
    const accessToken = await auth.interactiveAuth();
    
    // Update the .env file with the new token
    await updateEnvFile(accessToken);
    
    return accessToken;
  } catch (error) {
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
