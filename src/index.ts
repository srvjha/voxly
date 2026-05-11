import http from 'node:http'
import { createExpressApplication } from './app.js'

async function main(){
   try {
     const server = http.createServer(createExpressApplication());
    const PORT = process.env.PORT ?? 8080;

    server.listen(PORT,()=>{
        console.log(`Server is running on PORT: ${PORT}`)
    })
   } catch (error:any) {
     throw new Error(`Error Occured While creating server: ${error.message}`)
   }
}

main();