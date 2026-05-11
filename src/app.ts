import express from "express"
import type {Express} from 'express'

function createExpressApplication():Express{
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({extended:true}));
    
    app.get("/",(req,res)=>{
       res.json({health:"ok"})
    })
    return app;
}

export {createExpressApplication}