const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const { open } = require("sqlite");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertStateObjectToResponseObject = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};

const convertDistrictObjectToResponseObject = (newObject) => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  };
};

//Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const allStatesList = `SELECT * FROM state ORDER BY state_id;`;
  const statelist = await db.all(allStatesList);
  response.send(
    statelist.map((eachState) => convertStateObjectToResponseObject(eachState))
  );
});

//Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const newState = await db.get(getState);
  response.send(convertStateObjectToResponseObject(newState));
});

//Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const newDistrict = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`;
  await db.run(newDistrict);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT * FROM district WHERE district_id = ${district_id};`;
  const newDistrict = await db.get(getDistrict);
  response.send(convertDistrictObjectToResponseObject(newDistrict));
});

//Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `UPDATE 
    district 
    SET 
    district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     cured = ${cured},
     active = ${active},
     deaths = ${deaths}
     WHERE district_id = ${districtId};`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReport = `SELECT SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths,
    FROM district
    WHERE state_id = ${stateId};`;
  const stateReport = await db.get(getStateReport);
  const resultReport = convertStateObjectToResponseObject(stateReport);
  response.send(resultReport);
});

//Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `SELECT state_id FROM district 
    WHERE district_id = ${districtId};`;

  const stateName = await db.get(stateDetails);

  const getStateNameQuery = `SELECT state_name as sateName FROM state WHERE state_id = ${stateName.state_id};`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
