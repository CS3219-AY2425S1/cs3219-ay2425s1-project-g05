import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // frontend dev
  'http://peerprep.s3-website-ap-southeast-1.amazonaws.com', // frontend prod
  'http://peerprep-frontend-bucket.s3-website-ap-southeast-1.amazonaws.com', // frontend staging
  'https://01678sag05.execute-api.ap-southeast-1.amazonaws.com',
  'http://peerprep-1039182349.ap-southeast-1.elb.amazonaws.com',
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
    'Cookie',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ],
  credentials: true,
};

function checkCors(request) {
  // Inspired by https://stackoverflow.com/questions/71384801/how-to-enable-cors-for-web-sockets-using-ws-library-in-node-js
  const origins = request?.rawHeaders ?? [];
  const allowedO = allowedOrigins.map((value, idx, array) => {
    const results = value.split('//');
    return results[results.length - 1];
  });

  for (const orig of allowedO) {
    for (const entry of origins) {
      if (entry.startsWith(orig)) {
        return true;
      }
    }
  }

  // invalid URL
  return false;
}

const corsMiddleware = cors(corsOptions);
export { corsMiddleware, checkCors };
