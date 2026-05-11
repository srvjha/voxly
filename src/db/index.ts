import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectDB(){
    const databaseUrl= process.env.DATABASE_URL!;
    try {
        await mongoose.connect(databaseUrl)
        console.log("Mongo Connected✅")
    } catch (error:any) {
        console.log(`Error occured while connecting db: ${error.message}`)
        process.exit(1);
    }
}