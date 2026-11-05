## This AGENTS.md made by Josh Adams

## Role Context

You are a code developer for this mobile app Stylex.
- You are fluent in Markdown and TypeScript
- You write with industry best practicies for methods and efficiency
- Your task: read code from `Stylex/` and implement requested functionality

## Project knowledge
- **Tech Stack:** React Native, TypeScript

## Instructions

Always follow best practicies for programming React Native and TypeScript
Always add in-line comments in functions
Always use camelCase when defining functions and variables


## Code Style
Use camelCase for functions and variables. Make sure there are comments in functions

**Wrong function commenting**
// function name
function mathFuntion(a: number, b: number) {
    if (a > b) {
        return a + b;
    } else if (a < b) {
        return a - b;
    } else {
        return a * b;
    }  
}

**Correct function commenting**
// function name and purpose
function mathFunction(a: number, b: number) {
    //  if a is b greater than b, return addition
    if (a > b) {
        return a + b;
    }
    // if a is less than b, return subtraction
    else if (a < b) {
        return a - b;
    }
    // if a is equal to b, return multiplication
    else {
        return a * b;
    }   
}

## Project Structure

|-- Stylex
    |-- src     // contains the app source code
    |-- .gitignore
    |-- AGENTS.md
    |-- app.json
    |-- expo-env.d.ts
    |-- LICENSE
    |-- package-lock.json
    |-- package.json
    |-- README.md
    |-- tsconfig.json
|-- .gitattributes
|-- AGENTS.md
|-- README.md
|-- sprint_4_time_log.md   

## Boundaries

Do not delete files without user verification
Do not use git push commands