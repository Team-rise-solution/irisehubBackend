import express from 'express';
import { 
    superAdminLogin,
    adminLogin, 
    createAdmin, 
    getAllAdmins, 
    getAdminById, 
    updateAdmin, 
    deleteAdmin
} from '../Controller/adminController.js';
import adminAuth from '../middleware/adminAuth.js';

const Router = express.Router();

// Public Routes
Router.post('/super-login', superAdminLogin);         // POST /api/admin/super-login - Super Admin login (from .env)
Router.post('/login', adminLogin);                    // POST /api/admin/login - Admin login

// Protected Routes (Admin authentication required)
Router.post('/create', adminAuth, createAdmin);       // POST /api/admin/create - Create new admin
Router.get('/all', adminAuth, getAllAdmins);          // GET /api/admin/all - Get all admins
Router.get('/single/:id', adminAuth, getAdminById);   // GET /api/admin/single/123 - Get admin by ID
Router.put('/:id', adminAuth, updateAdmin);           // PUT /api/admin/123 - Update admin
Router.delete('/:id', adminAuth, deleteAdmin);        // DELETE /api/admin/123 - Delete admin

export default Router;
