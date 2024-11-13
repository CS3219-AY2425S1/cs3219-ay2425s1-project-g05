import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // frontend dev
  'http://peerprep.s3-website-ap-southeast-1.amazonaws.com', // frontend prod
  'http://peerprep-frontend-bucket.s3-website-ap-southeast-1.amazonaws.com', // frontend staging
  'https://01678sag05.execute-api.ap-southeast-1.amazonaws.com',
  'http://peerprep-1039182349.ap-southeast-1.elb.amazonaws.com',
  'http://redis-001.mrdqdr.0001.apse1.cache.amazonaws.com:6379',
  'http://localhost:8000',
  'http://localhost:8001',
  'http://localhost:8002',
  'http://localhost:8004',
];

// PORT 8000 - FRONTEND
// PORT 5173 - FRONTEND DEV
// PORT 8001 - USER SERVICE
// PORT 8002 - MATCHING SERVICE
// PORT 8003 - QUESTION SERVICE
// PORT 8004 - COLLABORATION SERVICE


const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ],
  credentials: true,
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
