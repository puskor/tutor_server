const express = require('express')
require("dotenv").config();
const cors = require("cors")
const app = express()
const port = process.env.PORT || 5001
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        // await client.connect("");
        const db = client.db("V_tutor");
        app.get("/", (req, res) => {
            res.send("hello")
        })

        const tutors = db.collection("tutors");
        app.get("/tutor", async (req, res) => {
            const result = await tutors.find().toArray();
            // console.log(result)
            res.json(result);
        })

        app.post("/tutor", async (req, res) => {
            const tutorData = req.body;
            // console.log(tutorData);
            const result = await tutors.insertOne(tutorData);
            res.json(result);
        })

        const booking = db.collection("booking");
        app.post("/booking", async (req, res) => {
            const bookingData = req.body;
            const result = await booking.insertOne(bookingData);
            res.json(result);
        })
        app.get("/booking", async (req, res) => {
            const result = await booking.find().toArray();
            res.json(result);
        })
        app.get("/booking/:id", async (req, res) => {
            const { id } = req.params;
            const result = await booking.find({user_id:id}).toArray();
            res.json(result);
        })


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})