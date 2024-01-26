import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import adRoutes from './routes/ad.js'
import mongoose from 'mongoose'
import { DATABASE } from './config.js'
const app=express()

//midddlewares
app.use(express.json())
app.use(morgan("dev"))
app.use(cors())


//routes middleware

app.use('/api',authRoutes)
app.use('/api',adRoutes)

mongoose.connect(DATABASE).then(()=>console.log('db_connected'))
.catch(err=>console.log(err))

app.listen(8000,function(){
    console.log('server started at port 8000')
})
