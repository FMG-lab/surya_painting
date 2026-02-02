declare module '@vercel/node' {
  import type { NextApiRequest, NextApiResponse } from 'next';
  export type NowRequest = NextApiRequest;
  export type NowResponse = NextApiResponse;
}
