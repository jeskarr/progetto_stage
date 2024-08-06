# Chart-chooser
This is a prototype tool used for choosing the most suitable graph/chart based on the data type and objective of visualization.
It uses an LLM to find the goal and a rules system (provided by *json-rules-engine*) to combine the data type and the objective together.

## Software requirements
To run this project, you need to have **Node.js** installed along with **npm** for package management.
You can download Node.js from the [official website](https://nodejs.org/en/download/package-manager/current).

Please note that this code is developed using Node.js version `v21.4.0`.

## How to use
### Initial setup
The first time you run the project, you need to install the necessary dependencies using this command in your terminal:
```
npm install
```

### Running the project
To run the project, use the following command in your terminal:
``` 
node rules.js
```
After running the command, the application will prompt you with a series of questions in the terminal. Follow the on-screen instructions to provide the necessary input.

**Note:** This is a prototype, so if you wish to add your own data, you need to modify the *sampleData.js* file directly. Ensure you substitute the data while maintaining the existing structure. Alternatively, you can update the `getTypes(data)` function in *InputManager.js*, specifying the number of numerical and categorical variables as indicated in the comments.

**Important:** This tool utilizes an LLM provided by Zucchetti SpA, which may not be available at all times.

