const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

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

const convertToObject1 = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};
const convertToObject2 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};

// API 1(Getting all states)
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT
      *
    FROM
      state
    ORDER BY
      state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((arrayItem) => convertToObject1(arrayItem)));
});

// API 2(Getting states by stateId)
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT
      *
    FROM
      state
    WHERE
      state_id = ${stateId};`;
  const stateArray = await db.get(getStateQuery);
  response.send(convertToObject1(stateArray));
});

// API 3 (Creating district in district table)
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `insert into district(district_name,state_id,cases,cured,active,deaths)
    values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const createDistrictQueryResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
//Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `select * from district where district_id=${districtId};`;
  const getDistrictByIdQueryResponse = await db.get(getDistrictByIdQuery);
  response.send(convertToObject2(getDistrictByIdQueryResponse));
});

//API 5
// Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `delete from district where district_id=${districtId};`;
  const deleteDistrictQueryResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
//Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `update district set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id = ${districtId};`;

  const updateDistrictQueryResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatsQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths from district where state_id = ${stateId};`;

  const getStateByIDStatsQueryResponse = await db.get(getStateByIDStatsQuery);
  response.send(getStateByIDStatsQueryResponse);
});

//API 8
// Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateByDistrictIdQuery = `
    SELECT state_id 
        FROM district
    WHERE district_id=${districtId};`;
  const getStateByDistrictIdResponse = await db.get(getStateByDistrictIdQuery);
  const getStateNameQuery = `
    SELECT state_name as stateName
        FROM state
    WHERE state_id=${getStateByDistrictIdResponse.state_id};`;
  const getStateNameResponse = await db.get(getStateNameQuery);
  response.send(getStateNameResponse);
});

module.exports = app;
