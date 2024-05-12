const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

const app = express()

const corsOption = {
    origin:['http://localhost:5173'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOption))
app.use(express.json())

app.get('/',(req,res)=>{
    res.send("Vaaiya tomar server khawar jonno ready")
})

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})