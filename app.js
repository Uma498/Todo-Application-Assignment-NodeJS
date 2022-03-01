const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const { format } = require("date-fns");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

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

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

app.get("/todos/", async (request, response) => {
  let todoArray = null;

  let getTodosQuery = "";

  const { search_q = "", priority, status, category, dueDate } = request.query;

  switch (true) {
    /* ....has Priority and Status .... */

    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                 SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          todoArray = await db.all(getTodosQuery);

          response.send(
            todoArray.map((eachTodo) =>
              convertTodoObjectDBToResponseObject(eachTodo)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    /* ....has only Priority .... */

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `

              SELECT  * FROM todo  WHERE priority = '${priority}';`;
        todoArray = await db.all(getTodosQuery);

        response.send(
          todoArray.map((eachTodo) =>
            convertTodoObjectDBToResponseObject(eachTodo)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    /* ..... has only Status .... */

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                    SELECT * FROM todo  WHERE status = '${status}';`;
        todoArray = await db.all(getTodosQuery);

        response.send(
          todoArray.map((eachTodo) =>
            convertTodoObjectDBToResponseObject(eachTodo)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    /* ...... has Category and Status ..... */

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `

                SELECT  * FROM todo  WHERE  status = '${status}' AND category = '${category}' ;`;
          todoArray = await db.all(getTodosQuery);

          response.send(
            todoArray.map((eachTodo) =>
              convertTodoObjectDBToResponseObject(eachTodo)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    /* .....has both Category and Priority ...*/

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
                SELECT * FROM todo  WHERE  category = '${category}' AND priority = '${priority}';`;
          todoArray = await db.all(getTodosQuery);

          response.send(
            todoArray.map((eachTodo) =>
              convertTodoObjectDBToResponseObject(eachTodo)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    /* ..... has only Category .... */

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `

              SELECT * FROM todo  WHERE category = '${category}' ;`;
        todoArray = await db.all(getTodosQuery);

        response.send(
          todoArray.map((eachTodo) =>
            convertTodoObjectDBToResponseObject(eachTodo)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    /* ..... has only Search ..... */

    case hasSearchProperty(request.query):
      getTodosQuery = `select * from todo where todo like '%${search_q}%';`;
      todoArray = await db.all(getTodosQuery);

      response.send(
        todoArray.map((eachTodo) =>
          convertTodoObjectDBToResponseObject(eachTodo)
        )
      );

      break;

    default:
      getTodosQuery = `
        SELECT * FROM todo  WHERE todo LIKE '%${search_q}%';`;
      todoArray = await db.all(getTodosQuery);

      response.send(
        todoArray.map((eachTodo) =>
          convertTodoObjectDBToResponseObject(eachTodo)
        )
      );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId} ;`;

  const todo = await db.get(getTodoQuery);

  response.send(convertTodoObjectDBToResponseObject(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  // console.log(isMatch(date, "yyyy-MM-dd"));

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(date);

    const selectQuery = `SELECT * FROM todo WHERE due_date = '${newDate}' ;`;

    const result = await db.all(selectQuery);

    response.send(
      result.map((eachTodo) => convertTodoObjectDBToResponseObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");

          const createTodoQuery = `
                          INSERT INTO todo (id,todo,priority,status,category,due_date)

                          VALUES (${id},'${todo}','${priority}','${status}','${category}','${postNewDueDate}') ;`;

          await db.run(createTodoQuery);

          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = "";

  const requestBody = request.body;
  //console.log(requestBody);
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
               UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
           UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
              due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
               due_date='${dueDate}' WHERE id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send(`Todo Updated`);

      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
                 UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                 due_date='${newDueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deletedTodoQuery = ` DELETE FROM todo WHERE id=${todoId} ;`;

  await db.run(deletedTodoQuery);

  response.send("Todo Deleted");
});

module.exports = app;
