import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    userId: string;
    createdAt: Date;
    rawCreatedAt?: string; // For debugging original string
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    userId: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true },
    rawCreatedAt: { type: String, required: false },
}, {
    timestamps: true,
});

// Prevent model overwrite in development
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
