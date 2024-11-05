export const accessTokensNoExpiry = {
    "validCredentials": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTMyMzMzNDM1MzYzNzM4MzkzMDMxMzIiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiZGlzcGxheU5hbWUiOiJ0ZXN0IiwiaXNBZG1pbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsImlhdCI6MTczMDgyMzY0MX0.kXvZHijuU3kMWoZHBCMD7nEDa0G2EevBbPFZG2hu7nA",
    "missingEmail": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTMyMzMzNDM1MzYzNzM4MzkzMDMxMzIiLCJkaXNwbGF5TmFtZSI6InRlc3QiLCJpc0FkbWluIjpmYWxzZSwiaXNEZWxldGVkIjpmYWxzZSwiaWF0IjoxNzMwODIzNjQxfQ.Vvx4-992NWr9E1XBDr02ZN_BRVNC2h7GvpFzII6EeC0",
    "missingDisplayName": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTMyMzMzNDM1MzYzNzM4MzkzMDMxMzIiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiaXNBZG1pbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsImlhdCI6MTczMDgyMzY0MX0.QvzF6UMPxxw-ohdG1hcZVED2VE0MqZsO7Gl4-lqAQ-Q",
    "adminValidCredentials": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTMyMzMzNDM1MzYzNzM4MzkzMDMxMzIiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiZGlzcGxheU5hbWUiOiJ0ZXN0IiwiaXNBZG1pbiI6dHJ1ZSwiaXNEZWxldGVkIjpmYWxzZSwiaWF0IjoxNzMwODIzNjQxfQ.vyRxqB5Zj2oR6c-4CGiAtkC5_u4c7ULUHEZlSdS3rrk"
};


// console.log(jwt.sign({ userId: "313233343536373839303132", email: 'test@email.com', displayName: 'test', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET))
// console.log(jwt.sign({ userId: "313233343536373839303132", displayName: 'test', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET))
// console.log(jwt.sign({ userId: "313233343536373839303132", email: 'test@email.com', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET))
// console.log(jwt.sign({ userId: "313233343536373839303132", email: 'test@email.com', displayName: 'test', isAdmin: true, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET))


// console.log(jwt.sign({ email: 'test@email.com', displayName: 'test', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' }))
// console.log(jwt.sign({ displayName: 'test', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' }))
// console.log(jwt.sign({ email: 'test@email.com', isAdmin: false, isDeleted: false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' }))