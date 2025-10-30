---
title: "Schedule Tracker"
date: 2025-02-19
categories:
  - Project
tags: ["schedule-tracker", "project"]
---

# Schedule Tracker

The main purpose of this project is to digitize the progress tracking I currently do with the help of my diary. Why did I choose this project? It’s fairly simple, and I haven’t built an end-to-end application before (other than the webhook tester). This project will include features like user accounts, logins, authentication, and more.

Here’s a high-level overview of what I want to achieve:

### **Sessions Tracking**

I usually track my daily progress using sessions. While it’s not a perfect measure of the work done, I think it’s a fairly good indicator.

I break tasks into 45-minute chunks, calling each chunk a _session_ (you could adjust this to 1 hour, 1.5 hours, etc.). For smaller tasks, I use 30-minute chunks and call them _mini-sessions_ 😅.

Here’s what I want to track:

- **Number of sessions**
- **Gaps between sessions**

Currently, I track my sessions and daily session counts manually. With the data collected, I want to generate graphs and analytics.

![image.png](/images/2025-2-19-schedule-tracker/image.png)

![image.png](/images/2025-2-19-schedule-tracker/image%201.png)

### **Miscellaneous Goals**

In addition to tracking sessions, I also want to track specific goals like meditation, gym workouts, etc. Users will be able to define multiple goals and keep track of progress for each one.

![image.png](/images/2025-2-19-schedule-tracker/image%202.png)

I plan to create a system similar to GitHub’s contribution graph, where reaching more goals results in more green squares.

### **Next Steps**

This was a high-level overview of the project. The next step is to create an event modeling diagram to better understand the systems involved, the tasks required, and the goals to achieve.
