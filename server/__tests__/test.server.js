const { attemptToMatchUser, getWaitingUser, setWaitingUser, getUserWaitingToSkip, setUserWaitingToSkip, closeConnectionAndRematch, server, io, handleUserLeaveAndJoin } = require('../src/server');
const ioc = require("socket.io-client");


function createMockSocket() {
    return {
        partnerSocket: null,
        emit: jest.fn()
    };
}

beforeEach(() => {
    mockSocketB = createMockSocket();
    mockSocketC = createMockSocket();
    mockSocketD = createMockSocket();
});

describe("Utility Functions", () => {

    let mockSocketA;
    
    beforeEach(() => {
        mockSocketA = createMockSocket();
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

    let serverSocket;  
    let clientSocket;

    beforeEach((done) => {
        // Connect the client socket to the same server running in server.js
        clientSocket = ioc('http://localhost:3000', {
            reconnectionDelay: 0,
            forceNew: true,
            transports: ['websocket']
        });

        // Wait for the server to establish a connection with our test client
        io.once('connection', (socket) => {
            serverSocket = socket;
            done();
        });
    });

    afterEach(() => {
        clientSocket.disconnect();
    });

    describe("join-chat", () => {

        test("should set socket's userID attribute", (done) => {
            clientSocket.emit('join-chat', "foobar");
            serverSocket.on('join-chat', (arg) => {
                expect(arg).toBe("foobar");
                expect(serverSocket.userID).toBe(arg);
                done();
            });
        });

        test("when there's no waitingUser, should set socket as waitingUser", (done) => {
            setWaitingUser(null);
            clientSocket.emit('join-chat', "foobar");
            serverSocket.on('join-chat', (arg) => {
                // ensure the waitingUser is set
                expect(getWaitingUser()).toBe(serverSocket);
                expect(serverSocket.partnerSocket).toBeNull();
                done();
            });
        });

        test("when there's a waitingUser, waitingUser and joining socket should connect", (done) => {
            setWaitingUser(mockSocketB);
            clientSocket.emit('join-chat', "foobar");
            serverSocket.on('join-chat', (arg) => {
                // ensure the waitingUser is cleared
                expect(getWaitingUser()).toBeNull();

                // ensure the sockets store a reference to each other (form a connection)
                expect(mockSocketB.partnerSocket).toBe(serverSocket);
                expect(serverSocket.partnerSocket).toBe(mockSocketB);

                // ensure the waiting user was called with the userID of the joining user
                expect(mockSocketB.emit).toHaveBeenCalledWith('match-found', serverSocket.userID);
                done();
            });
        });
    });

    describe('disconnect', () => {

        test("should clear userWaitingToSkip if the disconnecting socket was the userWaitingToSkip", () => {
            setUserWaitingToSkip(serverSocket);
            serverSocket.disconnect();
            expect(getUserWaitingToSkip()).toBeNull();
        });

        test("should not clear userWaitingToSkip if the disconnecting socket wasn't the userWaitingToSkip", () => {
            setUserWaitingToSkip(mockSocketB);
            serverSocket.disconnect();
            expect(getUserWaitingToSkip()).toBe(mockSocketB);
        });

        test("should clear waitingUser if the disconnecting socket was the waitingUser", () => {
            setWaitingUser(serverSocket);
            serverSocket.disconnect();
            expect(getWaitingUser()).toBeNull();
        });

        test("should not clear waitingUser if the disconnecting socket wasn't the waitingUser", () => {
            setWaitingUser(mockSocketB);
            serverSocket.disconnect();
            expect(getWaitingUser()).toBe(mockSocketB);
        });

        test("should make partnerSocket the waitingUser if disconnecting socket has a partnerSocket and there's no waitingUser", () => {
            setWaitingUser(null);
            setUserWaitingToSkip(null);
            serverSocket.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = serverSocket;
            serverSocket.disconnect();
            expect(getWaitingUser()).toBe(mockSocketB);
            expect(mockSocketB.partnerSocket).toBeNull();
        });

        
        test("should connect partnerSocket with waitingUser if the disconnecting socket has a partnerSocket and there's a waitingUser", () => {
            // ensure that C is waiting
            setWaitingUser(mockSocketC);
            setUserWaitingToSkip(null);

            //ensure that serverSocket and B are connected
            serverSocket.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = serverSocket;

            // execute
            serverSocket.disconnect();

            // B and C should connect, waitingUser should be cleared
            expect(getWaitingUser()).toBeNull();
            expect(mockSocketB.partnerSocket).toBe(mockSocketC);
            expect(mockSocketC.partnerSocket).toBe(mockSocketB);
        });
    });
});  


afterAll((done) => {
    server.close(done);
});
