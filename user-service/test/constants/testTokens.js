export const accessTokensNoExpiry = {
    "validCredentials": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiZGlzcGxheU5hbWUiOiJ0ZXN0IiwiaXNBZG1pbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsImlhdCI6MTczMDYxNTMwOX0.9n7iPrPn57ibonERWEOODZahne1LqjNNWxWk74YWiuc",
    "missingEmail": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaXNwbGF5TmFtZSI6InRlc3QiLCJpc0FkbWluIjpmYWxzZSwiaXNEZWxldGVkIjpmYWxzZSwiaWF0IjoxNzMwNjE1MzA5fQ.oEjw8cQwVnpVD5gSrxTdZx7df_CNkRHvft9f2BlUoB0",
    "missingDisplayName": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiaXNBZG1pbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsImlhdCI6MTczMDYxNTMwOX0.P_oHFoRfssqHQjB7PufF-SL6FWapqROPI_J3rHrwxfI"
};


// console.log(jwt.sign({ email: 'test@email.com', displayName: 'test', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET))
// console.log(jwt.sign({ displayName: 'test', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET))
// console.log(jwt.sign({ email: 'test@email.com', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET))

// console.log(jwt.sign({ email: 'test@email.com', displayName: 'test', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' }))
// console.log(jwt.sign({ displayName: 'test', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' }))
// console.log(jwt.sign({ email: 'test@email.com', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' }))