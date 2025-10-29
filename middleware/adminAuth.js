import jwt from "jsonwebtoken"

const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ success: false, message: "Not Authorized. Please login again." });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token has admin info
        if (!token_decode.adminId) {
            return res.json({ success: false, message: "Invalid token. Please login again." });
        }

        // Add admin info to request
        req.admin = {
            id: token_decode.adminId,
            name: token_decode.name,
            email: token_decode.email,
            role: token_decode.role
        };

        next();
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Invalid token. Please login again." });
    }
}

export default adminAuth