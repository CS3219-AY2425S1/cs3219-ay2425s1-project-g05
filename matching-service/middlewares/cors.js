import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // frontend dev
  'http://peerprep.s3-website-ap-southeast-1.amazonaws.com', // frontend prod
  'http://peerprep-frontend-bucket.s3-website-ap-southeast-1.amazonaws.com', // frontend staging
  'https://csppwicfm9.execute-api.ap-southeast-1.amazonaws.com',
  'https://01678sag05.execute-api.ap-southeast-1.amazonaws.com',
  'http://a0bc731fbaa9f498984db9ee4e3d3ff5-1870679687.ap-southeast-1.elb.amazonaws.com',
  'http://redis-001.mrdqdr.0001.apse1.cache.amazonaws.com:6379',
  'http://localhost:8001', // user service
  'http://localhost:8002', // matching service
  'http://localhost:8003', // question service
  'http://localhost:8004', // collaboration service
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Content-Type',
    'Authorization',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ],
  credentials: true,
};

export default cors(corsOptions);
