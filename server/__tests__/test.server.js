const { attemptToMatchUser, getWaitingUser, setWaitingUser, closeConnectionAndRematch, server } = require('../src/server');

describe("attemptToMatchUser", () => {
  let mockSocketA, mockSocketB;

  beforeEach(() => {
        mockSocketA = {
            partnerSocket: null,
            emit: jest.fn()
        };
        mockSocketB = {
            partnerSocket: null,
            emit: jest.fn()
        };
  });
  
  test("socket becomes waitingUser when waitingUser is null", () => {
    // setup so there's no waitingUser
    setWaitingUser(null);

    //execute
    attemptToMatchUser(mockSocketA);

    // the waitingUser should be the socket since there was nobody to match with
    expect(getWaitingUser()).toBe(mockSocketA);
    expect(mockSocketA.partnerSocket).toBeNull();
  });

  test("sockets connect if socket attempts to match when there's a waiting user", () => {
    // setup so B is waitingUser
    setWaitingUser(mockSocketB);

    //execute
    attemptToMatchUser(mockSocketA);

    // the waitingUser should be cleared since we found a socket to match with
    expect(getWaitingUser()).toBeNull();
    // ensure the sockets store a reference to each other as their partner sockets
    expect(mockSocketA.partnerSocket).toBe(mockSocketB);
    expect(mockSocketB.partnerSocket).toBe(mockSocketA);
  });
});

describe("closeConnectionAndRematch", () => {
    let mockSocketA, mockSocketB, mockSocketC, mockSocketD;
  
    beforeEach(() => {
        mockSocketA = {
            partnerSocket: null,
            emit: jest.fn()
        };
        mockSocketB = {
            partnerSocket: null,
            emit: jest.fn()
        };
        mockSocketC = {
            partnerSocket: null,
            emit: jest.fn()
        };
        mockSocketD = {
            partnerSocket: null,
            emit: jest.fn()
        }
    });
    
    test("when there's a waitingUser, socket becomes the waitingUser and socket's partner matches with previous waitingUser", () => {
        // setup A-B connection with C as waitingUser
        mockSocketA.partnerSocket = mockSocketB;
        mockSocketB.partnerSocket = mockSocketA;
        setWaitingUser(mockSocketC);

        // execute
        closeConnectionAndRematch(mockSocketA);

        // ensure A is set as the waitingUser
        expect(mockSocketA.partnerSocket).toBeNull();
        expect(getWaitingUser()).toBe(mockSocketA);
        // ensure B and C formed connection
        expect(mockSocketB.partnerSocket).toBe(mockSocketC);
        expect(mockSocketC.partnerSocket).toBe(mockSocketB);
    });

    test("when two sockets are passed, they switch partners", () => {
        // setup A-B and C-D connections
        mockSocketA.partnerSocket = mockSocketB;
        mockSocketB.partnerSocket = mockSocketA;
        mockSocketC.partnerSocket = mockSocketD;
        mockSocketD.partnerSocket = mockSocketC;
        // ensure waitingUser is null
        setWaitingUser(null);

        // execute
        closeConnectionAndRematch(mockSocketA, mockSocketC);
        
        // ensure A and C formed connection
        expect(mockSocketA.partnerSocket).toBe(mockSocketC);
        expect(mockSocketC.partnerSocket).toBe(mockSocketA);
        // ensure B and D formed connection
        expect(mockSocketB.partnerSocket).toBe(mockSocketD);
        expect(mockSocketD.partnerSocket).toBe(mockSocketB);
    });
  });

afterAll(() => {
    server.close();
});