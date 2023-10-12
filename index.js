const express = require("express");
const dotenv = require("dotenv").config();
const connectDB = require("./src/config/db");
const route = require("./src/routers/userRouter");
const busroute = require("./src/routers/bussinessRouter")

const app = express();
app.use(express.urlencoded({extended:true}));
app.use(express.json());
connectDB();
app.use("/api",route);
app.use("/api",busroute);

console.log(new Date())


const port = process.env.PORT

app.listen(port,()=>{
    console.log(`Server is Running on Port : ${port}`)
})  