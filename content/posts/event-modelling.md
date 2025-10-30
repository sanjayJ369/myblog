---
title: "event modeling"
date: 2024-01-12
categories:
  - Blog
tags: ["learn", "event-modeling"]
---

# event modelling

**What is event modeling?**

Event modeling is a simple technique used to design a system. It generally takes relatively little time to learn and get started. In event modeling, we use sticky notes to write things down.

**Sticky note colors and their purposes:**

- **Orange sticky notes:** Represent events. We write down the event occurrence in the past tense. Events are generally triggered by the UI or by some external API.
  - Examples: Position updated, request received, response sent
- **Blue sticky notes:** Represent commands. We write down the command as an assertive sentence. A command is something that modifies the system state and is caused to happen.
  - Examples: Update player health, send request
- **Green sticky notes:** Represent views. A view is like a snapshot of the current system state. It can be used to display the current state of the system to the user and can also be used by other system applications.
  - Examples: Display player's health

**Let's try to create an event modeling diagram for a simple fitness app that we will be making.**

**Let's start with what we want our app to do:**

- Display today's to-do exercises
- Send reminder notifications to exercise
- Keep track of streaks

**Now that we know what our simple app should do, let's think about the events. Here are a few that I came up with:**

- Requested today's exercises
- Completed today's exercises
- Alarm set
- Notification sent
- Requested current streak
- Set time reached

![Untitled](/images/2024-1-11-event-modelling/Untitled.png)

Now that we have our events, let's see how these events can be triggered. We use simple wireframes or actual screenshots of the app (if it's already developed) to represent the UI. We align the UI wireframe with the event that will be triggered by user interaction.

![Untitled](/images/2024-1-11-event-modelling/Untitled1.png)

Now, let's add the blue sticky notes for the commands that need to be executed in order to trigger the events. Commands generally act as inputs from the user that change the state of the system

![Untitled](/images/2024-1-11-event-modelling/Untitled2.png)

And now, let's also include green sticky notes, which are generally used to display the state of the system. You can also use gears or other diagrams to represent work done by the API used by our app. Here, I have represented it as a cloud as a process.

![Untitled](/images/2024-1-11-event-modelling/Untitled3.png)

to know more about event modelling see: [https://eventmodeling.org/posts/what-is-event-modeling/](https://eventmodeling.org/posts/what-is-event-modeling/)

**Why we need to use event modelling?**

i feel like event modelling helps us understand the overall working of the system better

the idea can be communicated more effectively to the non technical people like UI\UX designers and more people can contribute actively to the designing and features of the system

event modelling make building CQRS based systems easier as there is a clear separation between the query an view in the system

**What is CQRS?**

CQRS stands for Command Query Responsibility Segregation. It is a design pattern that separates the read model from the write model. This means using one model for querying data and a separate model for updating data (including creates, updates, and deletes).

**When should we use CQRS?**

CQRS is generally used when there is a nonuniform distribution between queries to the database and updates to the database. When we have a single model for basic CRUD (Create, Read, Update, Delete) operations, scaling is not very efficient. Having two different models helps us scale the query model and update model independently, which makes our application more efficient. Proper scaling can even be done if we use different databases for reads and updates, but we need to make sure that they are in sync.

The CQRS model is also used when the business logic becomes more complex for basic CRUD operations.

**Things to keep in mind before implementing CQRS:**

Implementing CQRS can get complex, and if we are using separate databases for reads and updates, we need to maintain consistency between the databases. It is preferred not to use CQRS when the business logic is simple and simple CRUD models do the job.

sources:

[https://eventmodeling.org/posts/what-is-event-modeling/](https://eventmodeling.org/posts/what-is-event-modeling/)

[https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)

[https://martinfowler.com/bliki/CQRS.html](https://martinfowler.com/bliki/CQRS.html)
