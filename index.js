const express = require('express')
require("dotenv").config();
const cors = require("cors")
const app = express()
const port = process.env.PORT || 5001
app.use(cors())
app.use(express.json())
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.DB_URI;
const client = new MongoClient(uri);

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

const verifyToken =async (req, res, next) => {
    const authHeader = req?.headers?.authentication;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next();
    } catch (error) {
        return res.status(403).json({ message: "Forbidden" });
    }
}


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
            tutorData.slot = parseInt(tutorData.slot);
            // console.log(tutorData);
            const result = await tutors.insertOne(tutorData);
            res.json(result);
        })

        app.get("/tutor/:id", async (req, res) => {
            const { id } = req.params;
            const result = await tutors.find({ user_id: id }).toArray();
            // console.log(result)
            res.json(result);
        })
        app.get("/tutor_home", async (req, res) => {
            const result = await tutors.find().limit(6).toArray();
            // console.log(result)
            res.json(result);
        })

        app.delete("/tutor/:id", async (req, res) => {
            const { id } = req.params;
            // console.log(id)
            const result = await tutors.deleteOne({
                _id: new ObjectId(id)
            });
            res.json(result);
        })

        app.patch("/tutor/:id", async (req, res) => {
            const { id } = req.params;
            const updatedTutor = req.body;
            const result = await tutors.updateOne({
                _id: new ObjectId(id)
            },
                {
                    $set: updatedTutor
                });

            res.json(result);

        })


        const booking = db.collection("booking");
        app.post("/booking", async (req, res) => {
            // console.log("hello")
            const bookingData = req.body;
            // console.log(bookingData)

            const tutorId = bookingData.tutor_id;
            const tutor = await tutors.findOne({
                _id: new ObjectId(tutorId)
            });

            const slot = Number(tutor.slot)
            if (slot <= 0) {
                return res.status(400).json({ message: "No slots available" });
            }
            await tutors.updateOne(
                { _id: new ObjectId(tutorId) },
                { $inc: { slot: -1 } }
            );
            const result = await booking.insertOne(bookingData);
            res.json(result);
        })

        app.get("/booking", async (req, res) => {
            const result = await booking.find().toArray();
            res.json(result);
        })
        app.get("/booking/:id", verifyToken, async (req, res) => {
            // const token = req.headers.authentication;
            // console.log(token);
            const { id } = req.params;
            const result = await booking.find({ user_id: id }).toArray();
            res.json(result);
        })

        app.delete("/booking/:id", async (req, res) => {
            const { id } = req.params;
            console.log(id);
            const tutor = await booking.findOne({ _id: new ObjectId(id) });
            const tutorId = tutor.tutor_id;
            const slot = Number(tutor.slot)
            await tutors.updateOne(
                { _id: new ObjectId(tutorId) },
                { $inc: { slot: +1 } }
            );
            const result = await booking.deleteOne({
                _id: new ObjectId(id)
            });
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