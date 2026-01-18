
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShift extends Document {
    userId: string;
    company: string;
    branchCity: string;
    branchAddress: string;
    date: string; // YYYY-MM-DD
    production: number; // Hours
    updatedAt: Date;
}

// Composite key to avoid duplicates: User + Date + Company?
// Or just replicate raw lines.
// The CSV likely has unique rows per shift-user-date. 
// We will use a flexible schema.

const ShiftSchema: Schema = new Schema({
    userId: { type: String, required: true },
    company: { type: String, required: true },
    branchCity: { type: String, required: false },
    branchAddress: { type: String, required: false },
    date: { type: String, required: true },
    production: { type: Number, required: true, default: 0 },
    tariffType: { type: String, required: false }, // "1", "2" etc.
}, {
    timestamps: true,
});

// Create a compound index to potentially avoid massive duplicates if re-syncing?
// For now, we'll wipe and replace or just add?
// Given the instruction "update every 24 hours", simpler strategy is to upsert or replace all.
// But 30k+ records replace might be heavy. 
// Let's create an index for efficient filtering.
ShiftSchema.index({ date: 1, company: 1 });
ShiftSchema.index({ company: 1 });

const Shift: Model<IShift> = mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);

export default Shift;
