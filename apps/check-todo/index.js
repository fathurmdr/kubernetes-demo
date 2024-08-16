const express = require("express");
const Knex = require("knex");
const dotenv = require("dotenv");

dotenv.config();

const knex = Knex({
  client: "postgresql",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  pool: {
    min: 2,
    max: 10,
  },
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
      const duration = Date.now() - start;
      const method = req.method;
      const url = req.url;
      const timestamp = new Date().toISOString();
      const statusCode = res.statusCode;

      console.log(`[${timestamp}] ${method} ${url} ${statusCode} - ${duration}ms`);
  });
  
  next();
})

app.get("/", (req, res) => {
  res.send("keep alive!");
});

app.get("/todo", async (req, res, next) => {
  try {
    const todos = await knex("todo").select("*");
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

app.get("/todo/:id", async (req, res, next) => {
  try {
    const todo = await knex("todo").select("*").where("id", req.params.id);
    res.json(todo[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/todo/check/:id", async (req, res, next) => {
  try {
    await knex("todo")
      .update({
        done: Boolean(req.body.done),
      })
      .where("id", req.params.id);
    res.json("ok");
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
