const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const { format } = require("date-fns");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,

      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server is starting at http://localhost:3000")
    );
  } catch (e) {
    console.log("DB Error: ${e.message}");

    process.exit(1);
  }
};

initializeDBAndServer();

const convertTodoObjectDBToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,

    todo: dbObject.todo,

    status: dbObject.status,

    priority: dbObject.priority,

    category: dbObject.category,

    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let todoArray = null;

  let getTodosQuery = "";

  const { search_q = "", priority, status, category, dueDate } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `

      SELECT

        *

      FROM

        todo 

      WHERE

        todo LIKE '%${search_q}%'

        AND status = '${status}'

        AND priority = '${priority}';`;

      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `

      SELECT

        *

      FROM

        todo 

      WHERE

        todo LIKE '%${search_q}%'

        AND priority = '${priority}';`;

      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `

      SELECT

        *

      FROM

        todo 

      WHERE

        todo LIKE '%${search_q}%'

        AND status = '${status}';`;

      break;

    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `

      SELECT

        *

      FROM

        todo 

      WHERE

        todo LIKE '%${search_q}%'

        AND status = '${status}'

        AND category = '${category}' ;`;

      break;

    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `

      SELECT

        *

      FROM

        todo 

      WHERE

        todo LIKE '%${search_q}%'

        AND  category = '${category}'

        AND priority = '${priority}';`;

      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `

      SELECT

        *

      FROM

        todo 

      WHERE

        todo LIKE '%${search_q}%'

        AND category = '${category}' ;`;

      break;

    default:
      getTodosQuery = `

      SELECT

        *

      FROM

        todo 

      WHERE

        todo LIKE '%${search_q}%';`;
  }

  todoArray = await db.all(getTodosQuery);

  response.send(
    todoArray.map((eachTodo) => convertTodoObjectDBToResponseObject(eachTodo))
  );
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId} ;`;

  const todo = await db.get(getTodoQuery);

  response.send(convertTodoObjectDBToResponseObject(todo));
});

app.get("/agenda/", async (request, response) => {
  const { dueDate } = request.body;

  const date = format(new Date("${dueDate}"), "yyyy-mm-dd");

  const selectQuery = `SELECT * FROM todo WHERE due_date = '${date}') ;`;

  const result = await db.get(selectQuery);

  response.send(convertTodoObjectDBToResponseObject(result));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const createTodoQuery = `

    INSERT INTO todo (id,todo,priority,status,category,due_date)

    VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}') ;`;

  await db.run(createTodoQuery);

  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = "";

  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";

      break;

    case requestBody.priority !== undefined:
      updateColumn = "Priority";

      break;

    case requestBody.todo !== undefined:
      updateColumn = "Todo";

      break;

    case requestBody.category !== undefined:
      updateColumn = "Category";

      break;

    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";

      break;
  }

  const previousTodoQuery = `

    SELECT 

    * 

    FROM todo 

    WHERE id=${todoId} ;`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,

    status = previousTodo.status,

    priority = previousTodo.priority,

    category = previousTodo.category,

    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = ` 

    UPDATE todo 

    SET 

      todo = '${todo}',

      status = '${status}',

      priority = '${priority}',

      category = '${category}',

      due_date = '${dueDate}'

      WHERE id = ${todoId} ;`;

  const result = await db.run(updateTodoQuery);

  if (result) {
    response.send(`${updateColumn} Updated`);
  } else {
    response.send(400);

    response.send(`Invalid Todo ${updateColumn}`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deletedTodoQuery = ` DELETE FROM todo WHERE id=${todoId} ;`;

  await db.run(deletedTodoQuery);

  response.send("Todo Deleted");
});

module.exports = app;
