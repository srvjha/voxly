import http from 'node:http'
import { createExpressApplication } from './app.js'
import { connectDB } from './db/index.js';
import dotenv from 'dotenv';
dotenv.config();

async function main(){
   try {
     const server = http.createServer(createExpressApplication());
    const PORT = process.env.PORT ?? 8080;

    server.listen(PORT,()=>{
        console.log(`Server is running on PORT: ${PORT}`)
    })
    await connectDB();
   } catch (error:any) {
     throw new Error(`Error Occured While creating server: ${error.message}`)
   }
}

main();