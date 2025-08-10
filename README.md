# A/B Testing Application (Node.js + SQLite)

## Overview
This project implements an **A/B testing demo** using **Node.js**, **Express**, and **SQLite**.  
It serves two UI variants ("Alpha" and "Beta") randomly, assigns a persistent variant per user session, and logs user interactions for later analysis.

## Features
- Randomized variant allocation with **session persistence**
- Two fully distinct UI layouts with modern styling
- User click events stored in SQLite with timestamp & IP address
- Simple in-browser UI for interaction and refresh testing
- Easily extendable for real-world A/B testing scenarios

## Tech Stack
- **Node.js** – backend server
- **Express** – routing and middleware
- **EJS** – template rendering
- **Express-Session** – session tracking
- **Better-SQLite3** – file-based database
- **UUID** – unique session/user IDs
- **Bootstrap** + CSS – responsive UI styling

## Installation
1. git init
   cd abtest-node
2. npm install
3. npm start
4. http://localhost:3000


