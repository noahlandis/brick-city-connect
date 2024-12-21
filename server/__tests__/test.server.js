const { attemptToMatchUser, getWaitingUser, setWaitingUser, getUserWaitingToSkip, setUserWaitingToSkip, closeConnectionAndRematch, getIO, handleUserLeaveAndJoin } = require('../src/signaling_server');
const { server } = require('../src/server');
const ioc = require("socket.io-client");
const Bugsnag = require('@bugsnag/js');

jest.mock('@bugsnag/js', () => {
    const mockBugsnag = {
        start: jest.fn(() => mockBugsnag),
        getPlugin: jest.fn(() => ({
            requestHandler: jest.fn(),
            errorHandler: jest.fn()
        })),
        notify: jest.fn()
    };
    return mockBugsnag;
});


  

function createMockSocket() {
    return {
        partnerSocket: null,
        emit: jest.fn()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
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

        test("notify bugsnag when socket attempts to match with itself", () => {
            setWaitingUser(mockSocketA);
            attemptToMatchUser(mockSocketA);
            expect(Bugsnag.notify).toHaveBeenCalled();
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
        getIO().once('connection', (socket) => {
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

        test("given a B-C connection and B is the userWaitingToSkip, A joining should cause B to be the waitingUser and A and C should connect", (done) => {
            // ensure B is the userWaitingToSkip
            setWaitingUser(null);
            setUserWaitingToSkip(mockSocketB);

            // setup B-C connection
            mockSocketB.partnerSocket = mockSocketC;
            mockSocketC.partnerSocket = mockSocketB;
            clientSocket.emit('join-chat', "foobar");
            serverSocket.on('join-chat', (arg) => {
                // ensure the userWaitingToSkip was cleared
                expect(getUserWaitingToSkip()).toBeNull();

                // ensure B is the new waitingUser
                expect(getWaitingUser()).toBe(mockSocketB);
                expect(mockSocketB.partnerSocket).toBeNull();

                // ensure A-C connection is formed
                expect(serverSocket.partnerSocket).toBe(mockSocketC);
                expect(mockSocketC.partnerSocket).toBe(serverSocket);
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

        test("given A-B connection with B as userWaitingToSkip, and no waitingUser, userWaitingToSkip should be cleared when A leaves and B should be the waitingUser", () => {
            // ensure that B is the userWaitingToSkip
            setWaitingUser(null);
            setUserWaitingToSkip(mockSocketB);

            // ensure that serverSocket and B are connected
            serverSocket.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = serverSocket;

            // execute
            serverSocket.disconnect();

            // B should be the waitingUser
            expect(getWaitingUser()).toBe(mockSocketB);
            expect(mockSocketB.partnerSocket).toBeNull();;

            // the userWaitingToSkip should be cleared
            expect(getUserWaitingToSkip()).toBeNull();
        });

        test("given A-B and C-D connections, if C is the userWaitingToSkip and A leaves, B and D should connect and C should be the waitingUser", () => {
            // A-B, C-D A presses next. C leaves. A is waiting user, B and D connect
            // set userWaitingToSkip as mockSocketC
            setWaitingUser(null);
            setUserWaitingToSkip(mockSocketC);
            // ensure A and B are connected
            serverSocket.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = serverSocket;
            // ensure C and D are connected
            mockSocketC.partnerSocket = mockSocketD;
            mockSocketD.partnerSocket = mockSocketC;

            // execute
            serverSocket.disconnect();

            // C should be the waitingUser
            expect(getWaitingUser()).toBe(mockSocketC);
            expect(mockSocketC.partnerSocket).toBeNull();;
            // the userWaitingToSkip should be cleared
            expect(getUserWaitingToSkip()).toBeNull();
            // B and D should be connected
            expect(mockSocketB.partnerSocket).toBe(mockSocketD);
            expect(mockSocketD.partnerSocket).toBe(mockSocketB);
        });

        test("notify bugsnag if leaving socket is not waitingUser and doesn't have partner", () => {
            setWaitingUser(null);
            serverSocket.partnerSocket = null;
            serverSocket.disconnect();
            expect(Bugsnag.notify).toHaveBeenCalled();
        });
    });

    describe('next', () => {

        test("nothing happens when socket pressing next is the waitingUser", (done) => {
            setWaitingUser(serverSocket);
            setUserWaitingToSkip(null);
            serverSocket.partnerSocket = null;
            clientSocket.emit('next');
            serverSocket.on('next', () => {
                expect(getWaitingUser()).toBe(serverSocket);
                expect(getUserWaitingToSkip()).toBeNull();
                expect(serverSocket.partnerSocket).toBeNull();
                done();
            });
        });

        test("nothing happens when socket pressing next is the userWaitingToSkip", (done) => {
            setWaitingUser(null);
            setUserWaitingToSkip(serverSocket);
            serverSocket.partnerSocket = null;
            clientSocket.emit('next');
            serverSocket.on('next', () => {
                expect(getWaitingUser()).toBeNull();
                expect(getUserWaitingToSkip()).toBe(serverSocket);
                expect(serverSocket.partnerSocket).toBeNull();
                done();
            });
        });

        test("when there's no waitingUser and no userWaitingToSkip, the socket pressing next should become the userWaitingToSkip", (done) => {
            setWaitingUser(null);
            setUserWaitingToSkip(null);
            clientSocket.emit('next');
            serverSocket.on('next', () => {
                // ensure that the socket becomes the userWaitingToSkip
                expect(getUserWaitingToSkip()).toBe(serverSocket);
                done();
            });
        });

        test("when there's no waitingUser and the userWaitingToSkip is partners with the socket pressing next, the userWaitingToSkip is updated to the socket who pressed next", (done) => {
            setWaitingUser(null);
            setUserWaitingToSkip(mockSocketB);

            // setup connection between A and B
            serverSocket.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = serverSocket;
            clientSocket.emit('next');
            serverSocket.on('next', () => {
                // ensure that the socket becomes the userWaitingToSkip
                expect(getUserWaitingToSkip()).toBe(serverSocket);
                done();
            });
        });

        test("when there's no waitingUser and the userWaitingToSkip isn't partners with the socket pressing next, socket pressing next and the userWaitingToSkip should swap partners", (done) => {
            setWaitingUser(null);
            setUserWaitingToSkip(mockSocketC);
            // setup connection between A and B
            serverSocket.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = serverSocket;
            // setup C and D connection
            mockSocketC.partnerSocket = mockSocketD;
            mockSocketD.partnerSocket = mockSocketC;
            clientSocket.emit('next');
            serverSocket.on('next', () => {
                // ensure the userWaitingToSkip is cleared
                expect(getUserWaitingToSkip()).toBeNull();
                // ensure A-C connection is formed
                expect(serverSocket.partnerSocket).toBe(mockSocketC);
                expect(mockSocketC.partnerSocket).toBe(serverSocket);
                // ensure B-D connection is formed
                expect(mockSocketB.partnerSocket).toBe(mockSocketD);
                expect(mockSocketD.partnerSocket).toBe(mockSocketB);
                done();
            });
        });

        test("when there's a waitingUser (who isn't the socket pressing next), the socket pressing next should become the waitingUser and the waitingUser should connect with the socket pressing next's partner", (done) => {
            setWaitingUser(mockSocketC);
            setUserWaitingToSkip(null);
            // setup connection between A and B
            serverSocket.partnerSocket = mockSocketB;
            mockSocketB.partnerSocket = serverSocket;
            
            clientSocket.emit('next');
            serverSocket.on('next', () => {
                // ensure A becomes the waitingUser
                expect(getWaitingUser()).toBe(serverSocket);
                expect(serverSocket.partnerSocket).toBeNull();
                // ensure B-C connection is formed
                expect(mockSocketB.partnerSocket).toBe(mockSocketC);
                expect(mockSocketC.partnerSocket).toBe(mockSocketB);
                done();
            });
        });

    });
});  


afterAll((done) => {
    server.close(done);
});
