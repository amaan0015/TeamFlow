# TeamFlow

### Collaborative Project & Task Management Platform

**Plan projects. Assign responsibilities. Track progress. Collaborate efficiently.**

TeamFlow is a full-stack project and task management application built with the MERN stack. It provides a centralized workspace where teams can organize projects, assign tasks, monitor progress, and collaborate through comments, notifications, and activity tracking.

The project focuses on solving a common coordination problem: keeping tasks, responsibilities, deadlines, and project updates organized in one place.

---

## Overview

Managing a team project becomes difficult when responsibilities are scattered across conversations, deadlines are tracked manually, and progress is not visible to everyone.

TeamFlow brings these activities into a single application. Users can organize workspaces and projects, assign tasks to team members, move tasks through different stages, and review their individual workload.

**Project goals:**

- Centralize project and task management.
- Make task ownership and progress easier to understand.
- Support collaboration through comments and notifications.
- Provide visibility into individual assignments and team activities.
- Build a maintainable full-stack application using modern web technologies.

## Key Features

### Authentication and Access Control

- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected frontend routes and authenticated backend endpoints.
- Workspace membership checks for protected resources.

### Workspace and Project Management

- Create and organize workspaces.
- Associate workspaces with owners and members.
- Organize related work into projects.
- Represent workspace membership using roles such as owner, admin, and member.

### Task Management

- Create, update, and delete tasks.
- Assign tasks to team members.
- Manage task priorities and due dates.
- Track task status through a Kanban-style board.
- Drag and drop tasks between status columns.
- View personally assigned work through the My Tasks page.

### Collaboration

- Add comments to tasks.
- Track supported task activities.
- Receive notifications for relevant events.
- Use real-time communication through Socket.IO where configured.

### My Tasks

- View tasks assigned to the logged-in user.
- Search and filter tasks.
- Identify overdue and high-priority work.
- Review task status and deadlines in one place.

### Dashboard

- Access a centralized overview of project work.
- Review available task and project information.
- Extend the dashboard with team workload and productivity analytics.

---

## Application Workflow

TeamFlow follows a structured workflow, from user authentication to task completion.

```text
              User Registration
                     |
                     v
                  Login
                     |
                     v
              User Dashboard
                     |
                     v
             Create Workspace
                     |
                     v
          Organize Team Members
                     |
                     v
              Create Project
                     |
                     v
               Create Tasks
                     |
                     v
       Assign Tasks, Priority and Dates
                     |
                     v
             Manage Task Board
                     |
                     v
        Comments and Status Updates
                     |
                     v
        Activity and Notifications
                     |
                     v
          Review and Complete Work
```

### How it works

1. **Authenticate:** Users register or log in to access protected features.
2. **Organize:** A workspace provides a shared area for team collaboration.
3. **Plan:** Projects group related work into manageable units.
4. **Assign:** Tasks are created with details such as status, priority, deadline, and assignee.
5. **Execute:** Team members update task progress through the task board.
6. **Collaborate:** Comments, activity records, and notifications help users follow relevant changes.
7. **Review:** The task board and My Tasks page help users identify remaining work and track completion.

---

## Task Lifecycle

Tasks can be organized into four main statuses:

| Status      | Description                      |
| ----------- | -------------------------------- |
| To Do       | Work that has not started        |
| In Progress | Work currently being performed   |
| In Review   | Work awaiting review or feedback |
| Done        | Work marked as completed         |

The task board provides a visual representation of work in progress. Drag-and-drop interactions make it easier to update task status, while the backend persists changes when the update succeeds.

---

## Technology Stack

| Layer                   | Technologies                  |
| ----------------------- | ----------------------------- |
| Frontend                | React.js, Vite                |
| Styling                 | Tailwind CSS                  |
| Routing                 | React Router                  |
| HTTP Client             | Axios                         |
| Icons                   | Lucide React                  |
| Backend                 | Node.js, Express.js           |
| Database                | MongoDB, Mongoose             |
| Authentication          | JSON Web Tokens (JWT), bcrypt |
| Validation              | Zod                           |
| Real-time Communication | Socket.IO, where configured   |
| Development Tools       | Git, GitHub, Postman, VS Code |

---

## System Architecture

TeamFlow uses a client-server architecture that separates the user interface, application logic, and data persistence.

```text
┌────────────────────────────────┐
│         React Frontend         │
│                                │
│ Pages • Components • Routing   │
│ State Management • Axios       │
└────────────────┬───────────────┘
                 │
                 │ HTTP / REST API
                 v
┌────────────────────────────────┐
│        Express Backend         │
│                                │
│ Routes • Controllers           │
│ Authentication • Validation    │
│ Business Logic                 │
└────────────────┬───────────────┘
                 │
                 │ Mongoose
                 v
┌────────────────────────────────┐
│            MongoDB             │
│                                │
│ Users • Workspaces • Projects  │
│ Tasks • Comments • Activities  │
│ Notifications                  │
└────────────────────────────────┘

     Socket.IO event channel
       where configured
```

### Frontend

The React application handles navigation, user interaction, form submission, task boards, and displaying data received from backend APIs.

### Backend

The Express application exposes API endpoints, validates requests, authenticates users, checks resource access, executes business logic, and communicates with MongoDB.

### Database

MongoDB stores application data. Mongoose provides schema definitions and database operations for the application's models.

---

## Project Structure

The following is a representative structure. Adjust the paths to match the actual repository.

```text
TeamFlow/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── TaskBoard.jsx
│       │   └── MyTasks.jsx
│       ├── context/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   └── src/
│       ├── models/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── app.js
│       └── server.js
│
├── .gitignore
└── README.md
```

### Backend organization

- **Models:** Define database schemas and relationships.
- **Controllers:** Implement request handling and application logic.
- **Routes:** Map API endpoints to controller functions.
- **Middleware:** Handle shared request processing, including authentication and validation where configured.

This separation helps keep the backend organized and easier to maintain.

---

## Data Model Overview

TeamFlow works with several core entities.

| Entity       | Responsibility                                                  |
| ------------ | --------------------------------------------------------------- |
| User         | Stores user and authentication-related information              |
| Workspace    | Represents a shared workspace and its owner                     |
| Project      | Groups related work within a workspace                          |
| Task         | Stores task details, status, priority, due date, and assignment |
| Comment      | Stores discussions associated with tasks                        |
| Activity     | Records supported actions and changes                           |
| Notification | Stores notifications for relevant users                         |

Tasks, projects, workspaces, and users are connected through references and membership relationships defined by the corresponding data models.

The exact schema fields and relationship constraints depend on the implementation in the repository.

---

## Getting Started

### Prerequisites

Install the following before running the application:

- [Node.js](https://nodejs.org/)
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) or a local MongoDB instance
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/TeamFlow.git
cd TeamFlow
```

Replace `YOUR_USERNAME` with your GitHub username and ensure the repository URL matches your actual repository.

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key
```

Use the exact environment variable names expected by your existing backend code. Do not commit real credentials or secrets to GitHub.

Start the backend using the script defined in `server/package.json`. For example:

```bash
npm run dev
```

### 3. Configure the frontend

Open another terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

### 4. Verify the workflow

After starting both applications, verify that you can:

1. Register and log in.
2. Create a workspace and project.
3. Create and assign a task.
4. Move tasks between statuses.
5. View assigned tasks in My Tasks.
6. Test comments, activity tracking, and notifications where available.

---

## Security Considerations

The application uses several security-related mechanisms:

- Password hashing with bcrypt.
- JWT-based authentication.
- Protected routes and authenticated API endpoints.
- Request validation where configured.
- Workspace membership checks for relevant resources.
- Environment variables for sensitive configuration.

Authentication and authorization are different responsibilities. Production use requires checking permissions on the backend for every protected operation, including updates and deletions, and ensuring that users cannot access another workspace's data by modifying request identifiers.

---

## Testing Checklist

Before releasing a public demo, verify the following:

- [ ] Registration and login work correctly.
- [ ] Invalid credentials are rejected.
- [ ] Protected endpoints reject unauthenticated requests.
- [ ] Workspace and project access is properly restricted.
- [ ] Task creation, updating, assignment, and deletion work as intended.
- [ ] Drag-and-drop changes persist after refreshing.
- [ ] My Tasks displays the correct assignments.
- [ ] Comments and activity tracking work correctly.
- [ ] Notifications reach the intended users.
- [ ] Loading, empty, and error states are handled.
- [ ] Sensitive configuration is excluded from Git.

---

## Future Improvements

Potential improvements include:

- [ ] Team analytics and workload visualization.
- [ ] Stronger role-based authorization policies.
- [ ] Automated backend and frontend tests.
- [ ] Advanced task filtering and dependencies.
- [ ] Calendar and timeline views.
- [ ] Email notifications and deadline reminders.
- [ ] AI-assisted task breakdown and discussion summaries.
- [ ] Improved mobile responsiveness.
- [ ] Deployment, CI/CD, and application monitoring.

These improvements can be introduced incrementally based on actual user needs and the reliability of the current application.

---

## What This Project Demonstrates

TeamFlow is an opportunity to demonstrate practical full-stack engineering skills, including:

- Building a React frontend and Express backend.
- Designing REST APIs and integrating frontend requests.
- Implementing authentication and protected resources.
- Modeling related application data with MongoDB and Mongoose.
- Handling asynchronous operations and UI state.
- Implementing task assignment and drag-and-drop workflows.
- Organizing application logic using models, routes, controllers, and middleware.
- Developing a collaborative application around a real-world use case.

---

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit your changes with a descriptive message.
5. Open a pull request describing the proposed improvement.

---

## Author

**Amaan Alam**

- GitHub: [@amaan0015](https://github.com/amaan0015)
- LinkedIn: Add your LinkedIn profile URL.

---

*TeamFlow is a full-stack portfolio project focused on collaborative project management, task tracking, and team coordination.*
