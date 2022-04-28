const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

//middle ware
app.use(cors());
app.use(express.json());
//main area

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rsdjy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusUser").collection("services");
    const orderCollection = client.db("geniusUser").collection("order");
    /* --------------Auth here----------------- */
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    /* -------------Servie Api Here------------------ */
    //get Data:
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    //get single data:
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //recieved data from .. client and saved it:
    app.post("/services", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    //delete data from both side:
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
    /* -------------Order Api Here------------------ */
    //get
    app.get("/order", verifyJWT, async (req, res) => {
      const decoded = req.decoded.email;
      const email = req.query.email;
      if (email === decoded) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    });

    //post
    app.post("/order", async (req, res) => {
      const data = req.body;
      const order = await orderCollection.insertOne(data);
      res.send(order);
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(port, () => {
  console.log("Listening to port", port);
});
