import express from 'express'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// create the server
const app = express();
app.use(express.json());
app.use(cors({
  origin: "*"
}));

// secert password
const JWT_SECRET = process.env.JWT_SECRET;

// connect to database
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("database connected");
    } catch (err) {
        console.log(err);
    }
}

connectDB(); // call the function to connect data base

// models

// USER SCHEMA
const userschema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})
const usermodel = mongoose.model("Users", userschema);


// NOTES SCHEMA
const noteschema = new mongoose.Schema({
    userId: String,
    title: String,
    content: String
}, { timestamps: true })
const notemodel = mongoose.model("Notes", noteschema);

// check whether the user is created from our server
// next - is used to call other middle ware other wise it stops
function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No Token Found" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();

    } catch {
        return res.status(401).json({ message: "Invalid token" })
    }

}


// 1. REGISTER
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // find email present or not
        const foundemail = await usermodel.findOne({ email: email });

        if (foundemail) {
            return res.json({ message: "User already exist" });
        }

        const hashedpassword = await bcrypt.hash(password, 10);

        const user = await usermodel.create({
            name: name,
            email: email,
            password: hashedpassword
        });

        return res.json({
            message: "User Registered",
        })
    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }
});

// Login page (at login we have to generate token)

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // check if user exist or not
        const user = await usermodel.findOne({ email: email });

        if (!user) {
            return res.status(400).json({ message: "User Not exists" });
        }

        // check for password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Password" });
        }

        // now user exist so generate token so that we can identify
        const token = jwt.sign({ id: user._id }, JWT_SECRET);

        return res.status(200).json({ token: token });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
})


// user can see the profile of him
// How?
// between request and response use own middle ware to find it


// GET PROFILE DETAILS
app.get("/profile", auth, async (req, res) => {
    try {
        let id = req.userId;
        const user = await usermodel.findOne({ _id: id });
        return res.json(
            {
                name: user.name,
                email: user.email
            });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
})

// create or add  notes (when "ADD" button is clicked)
app.post("/notes", auth, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "All fields required" });
        }

        // add the title and content in to mongo db
        const note = await notemodel.create({
            userId: req.userId,
            title: title,
            content: content
        })

        // send that notes to the user
        return res.status(200).json({ message: "Note added" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }

})

// get all notes(It runs when ui refresh every time)
app.get("/notes", auth, async (req, res) => {

    try {
        let notes = await notemodel.find(
            { userId: req.userId },
            { title: 1, content: 1, _id: 1 }
        ).sort({ createdAt: -1 }); //latest first


        return res.json({ notes });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
})
// Search notes
app.get("/notes/search", auth, async (req, res) => {
    try {
        const keyword = req.query.q || "";

        const notes = await notemodel.find({
            userId: req.userId,
            $or: [
                {
                    title: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    content: {
                        $regex: keyword,
                        $options: "i"
                    }
                }
            ]
        }).sort({ createdAt: -1 });

        return res.json({ notes });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


// To delete note
app.delete("/notes/:id", auth, async (req, res) => {
    try {
        const noteid = req.params.id;
        await notemodel.deleteOne({
            _id: noteid,
            userId: req.userId
        })
        return res.json({ message: "Note deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
})

// update note
app.put("/notes/:id", auth, async (req, res) => {
    try {
        const noteid = req.params.id;

        const { title, content } = req.body;
        await notemodel.updateOne(
            {
                _id: noteid,
                userId: req.userId
            },
            {
                title: title,
                content: content
            }
        )
        res.json({ message: "Note updated" })
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
})

// update profile(Name update)
app.put("/profile/update-name", auth, async (req, res) => {
    try {
        const { name } = req.body;
        await usermodel.updateOne(
            {
                _id: req.userId
            },
            {
                name: name
            }
        );
        return res.status(200).json({ message: "Updated succesfully" })
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
})

// start the server
app.listen(process.env.PORT || 8000, () => {
    console.log("Server Started!");
})