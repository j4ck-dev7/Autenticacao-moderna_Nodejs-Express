import express from 'express'
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRouter.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/user', userRouter)

export default app