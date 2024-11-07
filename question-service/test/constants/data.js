export const sampleQuestions = {
    "validQuestion1": {
        "title": "some title",
        "description": {
            "descriptionText": "descr txt",
            "descriptionHtml": "descr html"
        },
        "categoriesId": [0, 1],
        "difficulty": "EASY",
        "testCases": [
            {
                "testCode": "some test code 1",
                "input": "some input 1",
                "isPublic": true,
                "expectedOutput": "expected output 1"
            },
            {
                "testCode": "some test code 2",
                "input": "some input 2",
                "isPublic": false,
                "expectedOutput": "expected output 2"
            }
        ],
        "templateCode": "some template code",
        "solutionCode": "some solution code",
        "link": "some link",
        // meta field is added by code, not in request. but should be in DB.
        "meta": {
            "publicTestCaseCount": 1,
            "privateTestCaseCount": 1,
            "totalTestCaseCount": 2
        },
        "isDeleted": false
    },
    "validQuestion2": {
        "title": "some title2",
        "description": {
            "descriptionText": "descr txt2",
            "descriptionHtml": "descr html2"
        },
        "categoriesId": [1, 2],
        "difficulty": "EASY",
        "testCases": [
            {
                "testCode": "some test code 1",
                "input": "some input 1",
                "isPublic": true,
                "expectedOutput": "expected output 1"
            },
            {
                "testCode": "some test code 2",
                "input": "some input 2",
                "isPublic": false,
                "expectedOutput": "expected output 2"
            }
        ],
        "templateCode": "some template code",
        "solutionCode": "some solution code",
        "link": "some link",
        // meta field is added by code, not in request. but should be in DB.
        "meta": {
            "publicTestCaseCount": 1,
            "privateTestCaseCount": 1,
            "totalTestCaseCount": 2
        },
        "isDeleted": false
    },
    "validQuestion3": {
        "title": "some title3",
        "description": {
            "descriptionText": "descr txt3",
            "descriptionHtml": "descr html3"
        },
        "categoriesId": [3, 4],
        "difficulty": "EASY",
        "testCases": [
            {
                "testCode": "some test code 1",
                "input": "some input 1",
                "isPublic": true,
                "expectedOutput": "expected output 1"
            },
            {
                "testCode": "some test code 2",
                "input": "some input 2",
                "isPublic": false,
                "expectedOutput": "expected output 2"
            },
            {
                "testCode": "some test code 3",
                "input": "some input 3",
                "isPublic": false,
                "expectedOutput": "expected output 3"
            }
        ],
        "templateCode": "some template code",
        "solutionCode": "some solution code",
        "link": "some link",
        // meta field is added by code, not in request. but should be in DB.
        "meta": {
            "publicTestCaseCount": 1,
            "privateTestCaseCount": 2,
            "totalTestCaseCount": 3
        },
        "isDeleted": false
    }
}

export const accessTokensNoExpiry = {
    "validCredentials": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTMyMzMzNDM1MzYzNzM4MzkzMDMxMzIiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiZGlzcGxheU5hbWUiOiJ0ZXN0IiwiaXNBZG1pbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsImlhdCI6MTczMDgyMzY0MX0.kXvZHijuU3kMWoZHBCMD7nEDa0G2EevBbPFZG2hu7nA",
    "missingEmail": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTMyMzMzNDM1MzYzNzM4MzkzMDMxMzIiLCJkaXNwbGF5TmFtZSI6InRlc3QiLCJpc0FkbWluIjpmYWxzZSwiaXNEZWxldGVkIjpmYWxzZSwiaWF0IjoxNzMwODIzNjQxfQ.Vvx4-992NWr9E1XBDr02ZN_BRVNC2h7GvpFzII6EeC0",
    "missingDisplayName": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTMyMzMzNDM1MzYzNzM4MzkzMDMxMzIiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiaXNBZG1pbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsImlhdCI6MTczMDgyMzY0MX0.QvzF6UMPxxw-ohdG1hcZVED2VE0MqZsO7Gl4-lqAQ-Q",
    "adminValidCredentials": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTMyMzMzNDM1MzYzNzM4MzkzMDMxMzIiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiZGlzcGxheU5hbWUiOiJ0ZXN0IiwiaXNBZG1pbiI6dHJ1ZSwiaXNEZWxldGVkIjpmYWxzZSwiaWF0IjoxNzMwODIzNjQxfQ.vyRxqB5Zj2oR6c-4CGiAtkC5_u4c7ULUHEZlSdS3rrk"
};