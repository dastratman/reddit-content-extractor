// Mock the chrome API
global.chrome = {
    runtime: {
        sendMessage: jest.fn(),
        onMessage: {
            addListener: jest.fn(),
        },
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
    tabs: {
        query: jest.fn(),
    },
    scripting: {
        executeScript: jest.fn(),
    },
};