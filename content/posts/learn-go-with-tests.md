---
title: "learn go with tests"
date: 2024-01-03
categories:
  - Blog
tags: ["learn", "go"]
---

### Part 1: Introduction

This is an article about my experience completing "Go with Tests." I wanted to learn a back-end programming language for web development, so after completing CS50, I first got started with web development from The Odin Project. However, I only did a few lessons and wasn't very consistent. Additionally, I felt like every three out of five engineering college students were learning the MERN tech stack, so I wanted to do something different.

I first stumbled across Go from ThePrimeGen video, which led me to boot.dev, where I learned about Go. Intrigued by this mix of C and Python, I discovered the free GitBook "Learn Go with Tests" and decided to give it a serious try and actually complete it.

It's funny that I got stuck in the first lesson itself. I had dual-booted my laptop and was using Ubuntu for programming, but I couldn't install any packages. Even though the commands ran, I couldn't see the files in the /bin directory. The solution was simply to change the permissions of the Go directory, but it took me quite a while to figure that out.

Before "Go with Tests," I had zero knowledge of TDD or how software applications were built and deployed in the real world. The first few lessons, until maps, were quite straightforward. They covered basic syntax and built the habit of using TDD to solve problems. Did you know there are no while or do while loops in Go? That surprised me! Slices and interfaces were new concepts for me, so I needed to do some YouTube watching and Googling to understand them. LLMs like Bard and ChatGPT were also a big help. When I didn't understand a concept or got stuck, I would ask them "Explain {topic} in simple terms." Then, I would watch videos or read articles to try to understand the concepts and write a detailed message explaining what I didn't understand and asking if my understanding was correct. This method helped me a lot, and I think you should give it a try.

### Part 2: Testing Fundamentals

Things got a bit harder with the testing fundamentals. I had no idea what acceptance tests were, but after watching some videos and doing some back-and-forth with LLMs, I got to know them better. In short, they are tests written to check the application's working from the user's perspective. I also learned how Docker is used to test the application in different environments and about the different types of test doubles that can be used. Most of the chapters used HTTP in the lessons, which helped me better understand how Go works with HTTP.

### Part 3: Building an Application

I think building an application was smooth sailing. Most of the things used were covered previously, and I was keeping track of things and resources using Notion. If I forgot something, I would go back and do a quick read. Even then, if I didn't get it, I would rewatch the videos on that particular topic and go back. Here's a [repo](https://github.com/sanjayJ369/learningGo) that i used to keep track of things, and I've also linked my Notion notes for some of the chapters. Take a look if you like!

Overall, I feel like "Learn Go with Tests" was a pretty good experience and helped me pick up a lot of new things, not just language-specific but programming-related in general. It was challenging enough to keep me engaged but not so hard that I wanted to give up. If you're a beginner-intermediate programmer, I think you should definitely give it a try.

github repo used to track progress: <https://github.com/sanjayJ369/learningGo>\
my github repo: <https://github.com/sanjayJ369>
