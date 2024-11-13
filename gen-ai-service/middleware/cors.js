import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173", // frontend dev
  "http://peerprep.s3-website-ap-southeast-1.amazonaws.com", // frontend prod
  "http://peerprep-frontend-bucket.s3-website-ap-southeast-1.amazonaws.com", // frontend staging
  "http://localhost:8000",
  "http://localhost:8001",
  "http://localhost:8002",
  "http://localhost:8003",
  "http://localhost:8004",
  "http://localhost:8005",
  "http://localhost:8006",
  "http://localhost:8007"
];

// PORT 8000 - FRONTEND
// PORT 5173 - FRONTEND DEV
// PORT 8001 - USER SERVICE
// PORT 8002 - MATCHING SERVICE
// PORT 8003 - QUESTION SERVICE
// PORT 8004 - COLLABORATION SERVICE
// PORT 8005 - COMMUNICATION SERVICE
// PORT 8006 - HISTORY SERVICE
// PORT 8007 - RUN SERVICE
// PORT 8008 - GEN AI SERVICE

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
