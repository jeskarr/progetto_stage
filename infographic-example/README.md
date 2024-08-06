# Infographic-example - VERSIONE BASE
This is an example of a web infographic created using mainly HTML, CSS and JS, with D3.js for data visualization elements. 
The topic of this infographic is the Bachelor Degree in Computer Science at the Università degli Studi di Padova.

It uses a local server (node.js *http-server*) to be viewed.

**Important:** This version of the infographic includes a basic term-based chatbot. For a more advanced feature (hybrid search) see the
`VERSIONE_INTEGRATA` branches.

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
To start the local server and view the infographic, use the following command in your cmd (in the root of the current directory):
``` 
http-server
```
After running the command, open your browser and navigate to [http://localhost:8080](http://localhost:8080) (or any other port number specified by `http-server`).