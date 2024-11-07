import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // frontend dev
  'http://peerprep.s3-website-ap-southeast-1.amazonaws.com', // frontend prod
  'http://peerprep-frontend-bucket.s3-website-ap-southeast-1.amazonaws.com', // frontend staging
  'https://01678sag05.execute-api.ap-southeast-1.amazonaws.com', // online api gateway
  'http://PeerPrepALB-705702575.ap-southeast-1.elb.amazonaws.com', // online load balancer
  'http://redis-001.mrdqdr.0001.apse1.cache.amazonaws.com:6379', // online redis instance
  'http://localhost:8000',
  'http://localhost:8001', // user service
  'http://localhost:8002', // matching service
  'http://localhost:8003', // question service
  'http://localhost:8004', // collaboration service
  'http://localhost:8005',
  'http://localhost:8006',
  'http://localhost:8007',
  'http://localhost:8008',
];

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

export default cors(corsOptions);
