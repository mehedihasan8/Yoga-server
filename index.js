const express = require("express");
const cors = require("cors");
const app = express();
// var jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(
  "sk_test_51NHNrxFZFG6tQRNii6PO7ei5HfJc754mAQkaXKFuTCxLQ1MjAvQ88lkM3McTAz54XcgtHuU6zl67sxFJf5Dc4fdD00SO8bNYiN"
);

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.SUMMER_CAMPING_USER);
console.log(process.env.SUMMER_CAMPING_PASS);

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
    await client.connect();
    const userCollection = client.db("yugaDB").collection("users");
    const instractorCollection = client.db("yugaDB").collection("instractor");

    const clessesCollection = client.db("yugaDB").collection("Clesses");

    const paymentCollection = client.db("yugaDB").collection("payment");

    const selectedCollection = client.db("yugaDB").collection("selectedClass");

    //   clesses Apis here

    app.get("/clesses", async (req, res) => {
      const result = await clessesCollection.find().toArray();
      res.send(result);
    });

    app.get("/addedclass", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await clessesCollection.find(filter).toArray();
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

    app.post("/addclass", async (req, res) => {
      const newClass = req.body;
      const result = await clessesCollection.insertOne(newClass);
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

    // app.delete("/myclases/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await selectedCollection.deleteOne(query);
    //   res.send(result);
    // });

    //   instractor  Apis here

    app.get("/instractor", async (req, res) => {
      const result = await instractorCollection.find().toArray();
      res.send(result);
    });

    //   All user Apis here

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
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

    // selected classes api
    app.get("/selectedClass", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await selectedCollection.find(filter).toArray();
      res.send(result);
    });

    //     app.post('/payment', async (req, res) => {
    //   const
    // })

    // create payment intent

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;

      const amount = parseInt(price * 100);

      console.log(amount, typeof amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      console.log(paymentIntent);
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payment", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
