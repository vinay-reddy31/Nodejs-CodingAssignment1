const path = require('path')
const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
var isValid = require('date-fns/isValid')

let db = null
const dbPath = path.join(__dirname, 'todoApplication.db')

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertToCamelCase = todo => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  }
}

//function calls
const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hascategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}
const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasCategory = requestQuery => {
  return requestQuery.category !== undefined
}
const hasSearch_q = requestQuery => {
  return requestQuery.search_q !== undefined
}

app.get('/todos/', async (request, response) => {
  const {search_q = '', status, priority, category} = request.query

  let getTodosResponseQuery = ''
  let data = null
  switch (true) {
    case hasPriorityAndStatus(request.query):
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosResponseQuery = `select * from Todo where priority='${priority}' AND status='${status}';`
          data = await db.all(getTodosResponseQuery)
          response.send(data.map(todosList => convertToCamelCase(todosList)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosResponseQuery = `select * from Todo where category='${category}' AND status='${status}';`
          data = await db.all(getTodosResponseQuery)
          response.send(data.map(todosList => convertToCamelCase(todosList)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hascategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'LOW' ||
          priority === 'MEDIUM'
        ) {
          getTodosResponseQuery = `select * from Todo where category='${category}' AND priority='${priority}';`
          data = await db.all(getTodosResponseQuery)
          response.send(data.map(todosList => convertToCamelCase(todosList)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosResponseQuery = `select * from Todo where status='${status}';`
        data = await db.all(getTodosResponseQuery)
        response.send(data.map(todosList => convertToCamelCase(todosList)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriority(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'DONE') {
        getTodosResponseQuery = `select * from Todo where priority='${priority}';`
        data = await db.all(getTodosResponseQuery)
        response.send(data.map(todosList => convertToCamelCase(todosList)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasSearch_q(request.query):
      getTodosResponseQuery = `select * from Todo where todo LIKE '%${search_q}%';`
      data = await db.all(getTodosResponseQuery)
      response.send(data.map(todosList => convertToCamelCase(todosList)))
      break

    case hasCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'Learning'
      ) {
        getTodosResponseQuery = `select * from Todo where category='${category}';`
        data = await db.all(getTodosResponseQuery)
        response.send(data.map(todosList => convertToCamelCase(todosList)))
        break
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    default:
      getTodosResponseQuery = `select * from Todo;`
      data = await db.all(getTodosResponseQuery)
      response.send(data.map(todosList => convertToCamelCase(todosList)))
  }
})

// API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `select * from Todo where id=${todoId};`
  const getTodo = await db.get(getTodoQuery)
  response.send(convertToCamelCase(getTodo))
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  var result = isMatch(date, 'yyyy-MM-dd')
  console.log(result)
  console.log(date)
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    console.log(newDate)
    const getDueDateQuery = `select * from Todo where due_date ='${newDate}';`
    const getTodo = await db.all(getDueDateQuery)
    response.send(getTodo.map(todo => convertToCamelCase(todo)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const createTodoQuery = `insert into Todo(id,todo,category,priority,status,due_date) values(${id},'${todo}','${category}',
          '${priority}','${status}','${newDate}');`
          await db.run(createTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5
app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''
  let updateTodoQuery = ''

  const previousTodoQuery = `select * from Todo where id=${todoId};`
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = format(new Date(previousTodo.due_date), 'yyyy-MM-dd'),
  } = request.body

  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        const updateTodoQuery = `
  UPDATE Todo set todo='${todo}',category='${category}',priority='${priority}',status='${status}',due_date='${dueDate}'
  where id=${todoId};`
        await db.run(updateTodoQuery)
        response.send(`Status Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        const updateTodoQuery = `
  UPDATE Todo set todo='${todo}',category='${category}',priority='${priority}',status='${status}',due_date='${dueDate}'
  where id=${todoId};`
        await db.run(updateTodoQuery)
        response.send(`Priority Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category == 'LEARNING'
      ) {
        const updateTodoQuery = `
  UPDATE Todo set todo='${todo}',category='${category}',priority='${priority}',status='${status}',due_date='${dueDate}'
  where id=${todoId};`
        await db.run(updateTodoQuery)
        response.send(`Category Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case requestBody.todo !== undefined:
      const updateTodoQuery = `
  UPDATE Todo set todo='${todo}',category='${category}',priority='${priority}',status='${status}',due_date='${dueDate}'
  where id=${todoId};`
      await db.run(updateTodoQuery)
      response.send(`Todo Updated`)
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const updateTodoQuery = `
  UPDATE Todo set todo='${todo}',category='${category}',priority='${priority}',status='${status}',due_date='${dueDate}'
  where id=${todoId};`
        await db.run(updateTodoQuery)
        response.send(`Due Date Updated`)
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `delete from Todo where id=${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
