"use strict";

module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    rootDir: "src",
    testPathIgnorePatterns: [
        "/node_modules/",
        "/src/interfaces/",
    ],
};
