import mongoose from 'mongoose';

// Story Schema
const storySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    number: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    storyTitle: {
        type: String,
        required: [true, 'Story title is required'],
        trim: true,
        maxlength: [200, 'Story title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    video: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectedReason: {
        type: String,
        default: null,
        trim: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for better performance
storySchema.index({ status: 1 });
storySchema.index({ createdAt: -1 });
storySchema.index({ status: 1, createdAt: -1 });

const Story = mongoose.model('Story', storySchema);

export default Story;

