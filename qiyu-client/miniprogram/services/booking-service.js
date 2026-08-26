"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = void 0;
const config_1 = require("./config");
const mock_service_1 = require("./mock-service");
const remote_service_1 = require("./remote-service");
exports.bookingService = config_1.apiConfig.mode === 'mock' ? mock_service_1.mockService : remote_service_1.remoteService;
