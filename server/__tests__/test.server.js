const { attemptToMatchUser, getWaitingUser, setWaitingUser, getUserWaitingToSkip, setUserWaitingToSkip, closeConnectionAndRematch, server, handleUserLeaveAndJoin } = require('../src/server');
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const ioc = require("socket.io-client");

describe("Utility Functions", () => {

    function createMockSocket() {
        return {
            partnerSocket: null,
            emit: jest.fn()
        };
    }

    let mockSocketA, mockSocketB, mockSocketC, mockSocketD;
    
    beforeEach(() => {
        mockSocketA = createMockSocket();
        mockSocketB = createMockSocket();
        mockSocketC = createMockSocket();
        mockSocketD = createMockSocket();
    });

    afterAll(() => {
        server.close();
    });

    describe("attemptToMatchUser", () => {

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

        test("when there's a waitingUser, socket becomes the waitingUser and socket's partner matches with previous waitingUser", () => {
            // setup A-B connection
            mockSocketA.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = mockSocketA;
            // set C as waitingUser
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


    describe("handleUserLeaveAndJoin", () => {

        test("when there's an A-B connection and no userWaitingToSkip, C becomes the waitingUser after joining", () => {
            // setup A-B connection with no userWaitingToSkip
            mockSocketA.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = mockSocketA;
            setUserWaitingToSkip(null);
            setWaitingUser(null);
        
            // execute
            handleUserLeaveAndJoin(mockSocketC);

            // ensure C is the waitingUser
            expect(mockSocketC.partnerSocket).toBeNull();
            expect(getWaitingUser()).toBe(mockSocketC);
            // ensure A-B connection hasn't changed
            expect(mockSocketA.partnerSocket).toBe(mockSocketB);
            expect(mockSocketB.partnerSocket).toBe(mockSocketA);
        });

        test("when there's an A-B connection and A is the userWaitingToSkip, A becomes the waitingUser after C joins and B-C connection is formed", () => {
            // setup A-B connection with A as the userWaitingToSkip
            mockSocketA.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = mockSocketA;
            setUserWaitingToSkip(mockSocketA);
            setWaitingUser(null);
        
            // execute
            handleUserLeaveAndJoin(mockSocketC);

            // ensure A is the waitingUser
            expect(mockSocketA.partnerSocket).toBeNull();
            expect(getWaitingUser()).toBe(mockSocketA);
            //ensure the userWaitingToSkip was reset
            expect(getUserWaitingToSkip()).toBeNull();
            // ensure B and C form connection
            expect(mockSocketB.partnerSocket).toBe(mockSocketC);
            expect(mockSocketC.partnerSocket).toBe(mockSocketB);
        });
    });
});

describe("Socket Events", () => {

    let io, serverSocket, clientSocket;
  
    beforeAll((done) => {
      const httpServer = createServer();
      io = new Server(httpServer);
      httpServer.listen(() => {
        const port = httpServer.address().port;
        clientSocket = ioc(`http://localhost:${port}`);
        io.on("connection", (socket) => {
          serverSocket = socket;
        });
        clientSocket.on("connect", done);
      });
    });
  
    afterAll(() => {
      io.close();
      clientSocket.disconnect();
    });   

    test("should work", (done) => {
        clientSocket.on("hello", (arg) => {
          expect(arg).toBe("world");
          done();
        });
        serverSocket.emit("hello", "world");
    });
});  
