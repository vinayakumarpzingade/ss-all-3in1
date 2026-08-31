# StartSafe Launchpad

Build a production-ready MVP of STARTSAFE – Learn • Build • Innovate.

DO NOT generate a demo website.

Build a fully functional SaaS application connected to Supabase.

Every module must read and write real-time data.

The platform consists of three connected portals sharing one database.

1. Student Ecosystem
2. College Command Center
3. Central Intelligence Dashboard

The entire application must work in real time.

======================================================
AUTHENTICATION
======================================================

Create Role-Based Authentication.

Roles:

• Super Admin
• College
• Student

Implement protected routes.

Session persistence.

Role detection after login.

======================================================
DEMO ACCOUNTS
======================================================

Generate:

1 Super Admin

Email:
admin@startsafe.in

Password:
Admin@123

------------------------------------------------------

College 1

P.E.S. College of Engineering, Mandya

Email:
pesce@startsafe.in

Password:
PESCE@123

------------------------------------------------------

College 2

Srushti Degree College

Email:
srushti@startsafe.in

Password:
Srushti@123

------------------------------------------------------

Generate five students for each college.

Each student contains

Name

USN

Semester

Department

Email

Password

Placement Readiness

Learning Progress

Mock Score

Coding Score

Projects

Certificates

======================================================
COLLEGE REGISTRATION FLOW
======================================================

Student cannot register independently.

Flow

Admin creates College.

↓

College account activated.

↓

College adds Students.

↓

Student receives login credentials.

↓

Student logs in.

↓

Learning Path becomes available.

Students should ONLY see content assigned by their College.

======================================================
ADMIN PORTAL
======================================================

This is the master control center.

Admin owns every learning path.

Admin creates

College

↓

Course

↓

Department

↓

Semester

↓

Learning Path

↓

Week

↓

Learning Content

The Admin must have a complete CMS.

------------------------------------------------------

Admin creates a Learning Path.

Example

Programming Foundations

or

Financial Accounting

or

Digital Marketing

------------------------------------------------------

Each Learning Path contains Weeks.

Example

Week 1

Week 2

Week 3

Each week contains editable sections.

======================================================
WEEK EDITOR
======================================================

The Admin should NOT create separate fields manually.

Instead provide ONE rich text / markdown editor where the Admin pastes structured content.

Example

Week 1

Objectives

Programming Basics

Variables

Operators

Loops

Cheat Sheet

(Paragraph)

MCQ Practice

(List of Questions)

Coding Practice

(List of Problems)

Mini Project

(Project Description)

Assignment

(Task)

Resources

(Video Links)

PDF Links

Reference Links

Interview Questions

When Admin clicks Publish

The system automatically parses the content.

Automatically separate

Objectives

↓

Cheat Sheet

↓

MCQs

↓

Coding Practice

↓

Mini Project

↓

Assignment

↓

Resources

↓

Interview Questions

These automatically appear in the Student Portal as separate sections.

======================================================
STUDENT PORTAL
======================================================

Student logs in.

Dashboard shows

Learning Progress

Current Week

Placement Readiness

Certificates

Projects

Mock Scores

Coding Scores

------------------------------------------------------

Learning Path

↓

Week 1

Objectives

Cheat Sheet

MCQ Practice

Coding Practice

Mini Project

Assignment

Resources

Interview Questions

Everything comes directly from the Admin CMS.

Students cannot edit.

Only complete.

======================================================
MOCK TEST FLOW
======================================================

Admin creates Mock Test.

↓

Assign to College

↓

Students receive Test

↓

Student attempts

↓

Score stored

↓

College Analytics updated

↓

Admin Dashboard updated

======================================================
CODING PRACTICE
======================================================

Admin creates Coding Problems.

↓

Assign to Learning Path.

↓

Students solve.

↓

Judge0 executes code.

↓

Result stored.

↓

Coding Score updated.

======================================================
PROJECT FLOW
======================================================

Admin creates Mini Project.

↓

Student submits

Project Name

GitHub

Description

Files

↓

College reviews status.

======================================================
CERTIFICATE FLOW
======================================================

Student completes

Learning

↓

Assignment

↓

Mock Test

↓

Project

↓

Certificate unlocked automatically.

======================================================
COLLEGE PORTAL
======================================================

College CANNOT edit learning content.

College responsibilities

Add Students

Assign Students

View Progress

Learning Analytics

Coding Analytics

Mock Analytics

Placement Readiness

Student Rankings

Weekly Reports

Download Reports

The College dashboard should automatically reflect Student activity.

======================================================
REAL-TIME SYNCHRONIZATION
======================================================

Example

Admin publishes Week 2

↓

Immediately visible to Students.

------------------------------------------------------

Student completes Week 1

↓

Progress updated.

↓

College Analytics updated.

↓

Admin Dashboard updated.

------------------------------------------------------

Student submits Project

↓

College Dashboard updates.

↓

Admin Dashboard updates.

------------------------------------------------------

Student completes Mock Test

↓

Student Score updates.

↓

College Analytics updates.

↓

Admin Analytics updates.

Everything must happen instantly using Supabase Realtime.

======================================================
DATABASE
======================================================

Create proper relational schema.

Tables

users

roles

colleges

students

learning_paths

weeks

lessons

cheat_sheets

mcqs

coding_questions

projects

assignments

mock_tests

certificates

progress

analytics

notifications

All relationships should be normalized.

======================================================
FINAL GOAL
======================================================

This should NOT behave like a static demo.

It should behave like a production-ready SaaS platform.

Every CRUD operation must work.

Every dashboard must use real database queries.

Every chart must update dynamically.

Every action must synchronize in real time across Student, College and Admin portals.

Build this as the foundation of StartSafe Version 1.0 Pilot Edition.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ss-all-3in1.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f2138070-48a0-44b5-9dfb-95c8b50be04b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
