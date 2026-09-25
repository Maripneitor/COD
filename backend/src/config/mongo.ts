import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectMongo = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI || '';
    if (!uri) {
      console.log('[Database] MONGO_URI no definida, saltando conexión a MongoDB Atlas.');
      return;
    }
    await mongoose.connect(uri);
    console.log('[Database] MongoDB Atlas conectado con éxito.');
  } catch (error) {
    console.error('[Database] Error conectando a MongoDB Atlas:', error);
    process.exit(1);
  }
};

const CodeSchema = new Schema({
  slot: { type: Number, required: true },
  code_name: { type: String, required: true },
  alphanumeric_val: { type: String, required: true },
  full_code: { type: String, required: true }
}, { _id: false });

const ObjectSchema = new Schema({
  object_id: { type: String, required: true },
  name: { type: String, required: true },
  codes: [CodeSchema]
}, { _id: false });

const ClassSchema = new Schema({
  class_id: { type: String, required: true },
  name: { type: String, required: true },
  sort_order: { type: Number, required: true },
  objects: [ObjectSchema]
}, { _id: false });

const ModeSchema = new Schema({
  mode_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  is_default: { type: Boolean, default: false },
  classes: [ClassSchema]
}, { timestamps: true });

export const ModeModel = mongoose.model('Mode', ModeSchema);
