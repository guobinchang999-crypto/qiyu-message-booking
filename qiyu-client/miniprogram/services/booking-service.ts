import { apiConfig } from './config';
import { mockService } from './mock-service';
import { remoteService } from './remote-service';

export const bookingService = apiConfig.mode === 'mock' ? mockService : remoteService;
