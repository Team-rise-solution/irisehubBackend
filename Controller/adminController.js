import adminModel from '../model/admin.js';
import jwt from 'jsonwebtoken';

// Super Admin Login (from .env)
const superAdminLogin = async (req, res) => {
    try {
        const { name, email } = req.body;

        // Check if credentials match .env values
        if (name === process.env.ADMIN_NAME && email === process.env.ADMIN_EMAIL) {
            // Generate JWT token
            const token = jwt.sign(
                { 
                    adminId: 'super_admin',
                    name: name,
                    email: email,
                    role: 'super_admin'
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: "Super Admin login successful",
                token,
                admin: {
                    id: 'super_admin',
                    name: name,
                    email: email,
                    role: 'super_admin'
                }
            });
        } else {
            res.json({
                success: false,
                message: "Invalid name or email"
            });
        }

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Admin Login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email
        const admin = await adminModel.findOne({ email, isActive: true });
        
        if (!admin) {
            return res.json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        // Compare password
        const isMatch = await admin.comparePassword(password);
        
        if (!isMatch) {
            return res.json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                adminId: admin._id, 
                email: admin.email, 
                role: admin.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Create Admin (Super Admin only)
const createAdmin = async (req, res) => {
    try {
        const { name, email, password, role = 'admin' } = req.body;

        // Validate input
        if (!name || name.trim().length < 2) {
            return res.json({
                success: false,
                message: "Name must be at least 2 characters"
            });
        }

        if (!email || !email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
            return res.json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        if (!password || password.length < 6) {
            return res.json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Check if admin already exists
        const existingAdmin = await adminModel.findOne({ email });
        if (existingAdmin) {
            return res.json({
                success: false,
                message: "Admin with this email already exists"
            });
        }

        const admin = new adminModel({
            name,
            email,
            password,
            role
        });

        await admin.save();

        res.json({
            success: true,
            message: "Admin created successfully! ✅",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.log('Create Admin Error:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.json({ 
                success: false, 
                message: messages.join(', ') 
            });
        }

        res.json({ success: false, message: error.message || 'Failed to create admin' });
    }
};

// Get All Admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await adminModel.find({ isActive: true })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: admins
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get Admin by ID
const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const admin = await adminModel.findById(id).select('-password');
        
        if (!admin) {
            return res.json({ 
                success: false, 
                message: "Admin not found" 
            });
        }

        res.json({ 
            success: true, 
            data: admin 
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Update Admin
const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body;

        const admin = await adminModel.findByIdAndUpdate(
            id,
            { name, email, role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!admin) {
            return res.json({ 
                success: false, 
                message: "Admin not found" 
            });
        }

        res.json({
            success: true,
            message: "Admin updated successfully",
            data: admin
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Delete Admin (Soft delete)
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await adminModel.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!admin) {
            return res.json({ 
                success: false, 
                message: "Admin not found" 
            });
        }

        res.json({
            success: true,
            message: "Admin deleted successfully"
        });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export {
    superAdminLogin,
    adminLogin,
    createAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin
};
