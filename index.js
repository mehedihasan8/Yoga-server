const express = require("express");
const cors = require("cors");
const app = express();
var jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_TOKEN);

const port = process.env.PORT || 5000;

// idleware ------------------------------

app.use(cors());
app.use(express.json());

// jwt midleware ------------------------------

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log("auth", authorization);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorizaed access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    console.log("mehedi hasan", err, decoded);
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorizaed access" });
    }
    req.decoded = decoded;
    next();
  });
};

// console.log(process.env.ACCESS_TOKEN);

// console.log(process.env.SUMMER_CAMPING_PASS);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.SUMMER_CAMPING_USER}:${process.env.SUMMER_CAMPING_PASS}@cluster0.wauv4p9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db("yugaDB").collection("users");
    const instractorCollection = client.db("yugaDB").collection("instractor");

    const clessesCollection = client.db("yugaDB").collection("Clesses");

    const paymentCollection = client.db("yugaDB").collection("payment");

    const selectedCollection = client.db("yugaDB").collection("selectedClass");

    // verify admin ---------------------------
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    // verify instructor ---------------------------

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    //  jwt.verify here

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // all  clesses Apis here

    app.get("/clesses", async (req, res) => {
      const result = await clessesCollection.find().toArray();
      res.send(result);
    });

    // top 6 classes here

    app.get("/populerclasses", async (req, res) => {
      const result = await clessesCollection
        .find()
        .sort({
          totalEnrolled: -1,
        })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/addedclass", verifyJWT, verifyInstructor, async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await clessesCollection.find(filter).toArray();
      res.send(result);
    });

    app.put("/addedclass/:id", async (req, res) => {
      const id = req.params.id;
      const updateClass = req.body;
      // console.log(id, updateClass);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          availableSeats: updateClass.availableSeats,
          price: updateClass.price,
        },
      };
      const result = await clessesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/addclass", verifyJWT, verifyInstructor, async (req, res) => {
      const newClass = req.body;
      const result = await clessesCollection.insertOne(newClass);
      res.send(result);
    });

    app.patch("/approvedClass/:id", async (req, res) => {
      const { status, feedback } = req.body;

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
          feedback,
        },
      };
      const result = await clessesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // app.post("/clesses", async (req, res) => {});

    app.get("/myclass", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await selectedCollection.find(filter).toArray();
      res.send(result);
    });

    app.post("/myclass", async (req, res) => {
      const clases = req.body;
      console.log(clases);
      const filter = { _id: clases._id };
      const olditem = await selectedCollection.findOne(filter);
      // console.log(olditem.availableSeats);

      if (olditem) {
        return res.send("card allrady exist");
      }
      const result = await selectedCollection.insertOne(clases);
      res.send(result);
    });

    //   instractor  Apis here

    app.get("/instractorall", async (req, res) => {
      const filter = { role: "instructor" };
      const result = await userCollection.find(filter).toArray();
      res.send(result);
    });

    app.get("/instractor", async (req, res) => {
      const filete = { role: "instructor" };
      const result = await userCollection.find(filete).limit(6).toArray();
      // console.log(result);
      res.send(result);
    });

    //   All user Apis here

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    app.get("/users/instructors/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already existinge" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const { role } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // selected classes api

    app.get("/selectedClass", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await selectedCollection.find(filter).toArray();
      res.send(result);
    });

    app.delete("/selectedClass/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await selectedCollection.deleteOne(query);
      res.send(result);
    });

    // create payment intent

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;

      const amount = parseInt(price * 100);

      // console.log(amount, typeof amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      // console.log(paymentIntent);
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/payment/:gmail", async (req, res) => {
      const email = req.params.gmail;
      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/paymenthistory/:gmail", async (req, res) => {
      const email = req.params.gmail;
      const query = { email: email };
      const result = await paymentCollection
        .find(query)
        .sort({
          date: -1,
        })
        .toArray();
      res.send(result);
    });

    app.post("/payment", async (req, res) => {
      const payment = req.body;

      const oldId = payment.classId;

      console.log(payment, "it old classes", oldId);

      const query = { _id: new ObjectId(oldId) };

      try {
        const oldeClesses = await clessesCollection.find(query).toArray();
        console.log("olde clesses found here:", oldeClesses[0]);
        const update = await clessesCollection.updateOne(oldeClesses[0], {
          $inc: { availableSeats: -1, totalEnrolled: 1 }, // Increment both fields by 1
        });

        // res.send(update);
      } catch (error) {
        console.error("Error finding olde clesses:", error);
      }

      // console.log("olde clesses find here ", oldeClesses);

      const result = await paymentCollection.insertOne(payment);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("summer camping server is running");
});

app.listen(port, () => {
  console.log(`summer camping server runnnig on port ${port}`);
});
