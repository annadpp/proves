require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const Person = require("./models/person"); // Import the Person model
app.use(cors());
app.use(express.json());
app.use(express.static("dist"));
// Define a new token for Morgan
morgan.token("post-body", (req) => {
  return JSON.stringify(req.body);
});
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :post-body"
  )
);
app.get("/", (request, response) => {
  response.send("<h1>Hello World!</h1>");
});
app.get("/info", (request, response) => {
  Person.countDocuments({}, (err, count) => {
    const currentTime = new Date().toString();
    response.send(
      `<p>Phonebook has info for ${count} people</p><p>${currentTime}</p>`
    );
  });
});
app.get("/api/persons", (request, response) => {
  Person.find({}).then((person) => response.json(person));
});
app.get("/api/persons/:id", (request, response, next) => {
  const id = request.params.id;
  Person.findById(id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});
app.delete("/api/persons/:id", (request, response, next) => {
  const id = request.params.id;
  Person.findByIdAndDelete(id)
    .then(() => response.status(204).end())
    .catch((error) => next(error));
});
app.post("/api/persons", (request, response) => {
  const body = request.body;
  const name = body.name;
  const number = body.number;

  if (!name) return response.status(400).json({ error: "name missing" });
  if (!number) return response.status(400).json({ error: "number missing" });

  Person.exists({ name }).then((personExists) => {
    if (personExists) {
      return response.status(400).json({ error: "name must be unique" });
    }

    const newPerson = new Person({ name, number });
    newPerson
      .save()
      .then((savedPerson) => {
        response.json(savedPerson);
      })
      .catch((error) => {
        console.error("error saving person to the database:", error);
        response.status(500).json({ error: "failed to save to the database" });
      });
  });
});

app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;

  const updatedPerson = {
    name: body.name,
    number: body.number,
  };

  Person.findByIdAndUpdate(request.params.id, updatedPerson, { new: true })
    .then((updatedPerson) => {
      response.json(updatedPerson);
    })
    .catch((error) => next(error));
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).json({ error: "malformatted id" });
  }
  next(error);
};
// This has to be the last loaded middleware.
app.use(errorHandler);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
