import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
dotenv.config();
export const db = drizzle(process.env.DATABASE_URL!);

export async function connectDB() {
   try {
     const result = await db.execute("SELECT 1")
    if (result) console.log("Db connected ✅")
   }
   catch (error:any) {
     console.log(`Error occured while connecting db: ${error.message}`)
     process.exit(1);
   }
}