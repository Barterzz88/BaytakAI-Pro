import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { protect } from './modules/auth';
import * as user from './handlers/userHandler';
import * as property from './handlers/propertyHandler';
import * as ai from './handlers/aiHandler';
import * as admin from './handlers/adminHandler';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const api = express.Router();
app.use('/api', api);

// Auth
api.post('/auth/register', user.register);
api.post('/auth/login', user.login);
api.post('/auth/refresh', user.refreshToken);
api.post('/auth/logout', user.logout);

// Properties
api.get('/property', property.getAll);
api.get('/property/:id', property.getOne);
api.post('/property', protect, property.create);
api.put('/property/:id', protect, property.update);
api.delete('/property/:id', protect, property.remove);

// Image upload: create signed upload URL (Supabase)
api.post('/upload-url', protect, property.createUploadUrl);

// Leads
api.post('/property/:id/contact', property.createLead);

// AI endpoints
api.post('/ai/parse-search', ai.parseSearch);
api.post('/ai/generate-description', protect, ai.generateDescription);

// Admin
api.get('/admin/pending', protect, admin.getPending);
api.post('/admin/approve/:id', protect, admin.approve);

export default app;
