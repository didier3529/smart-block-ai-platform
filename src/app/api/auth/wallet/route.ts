import { NextResponse } from 'next/server';
import { utils } from 'ethers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { address, signature, message, chainId } = await request.json();

    // Verify the signature
    const recoveredAddress = utils.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        sub: address,
        chainId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      JWT_SECRET
    );

    // Create user object
    const user = {
      id: address,
      address,
      networks: [chainId],
      preferences: {
        defaultNetwork: chainId,
        theme: 'dark',
        notifications: true,
      },
    };

    return NextResponse.json({
      token,
      user,
    });
  } catch (error) {
    console.error('Wallet authentication failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 