const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1 GET A LIST

const convertDbObjectToAPI1 = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    select * from player_details;`;
  const dbResponse = await db.all(getAllPlayersQuery);
  response.send(
    dbResponse.map((eachPlayer) => convertDbObjectToAPI1(eachPlayer))
  );
});

//API 2 GET
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdByQuery = `
    select * from player_details where player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayerIdByQuery);
  response.send(convertDbObjectToAPI1(dbResponse));
});

//API 3 PUT
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = ` 
    update player_details set player_name= "${playerName}"
    where player_id = ${playerId};`;
  const dbResponse = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4 GET
const convertDbToObjectAPI4 = (objectItem) => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchIdQuery = `
    select * from match_details where match_id = ${matchId};`;
  const dbResponse = await db.get(getMatchIdQuery);
  response.send(convertDbToObjectAPI4(dbResponse));
});

//API 5 GET
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdQuery = `
    select match_id from player_match_score where player_id = ${playerId};`;
  const getPlayerMatchDetails = await db.all(getPlayerIdQuery);

  //get matchArr
  const matchIdArr = getPlayerMatchDetails.map((eachPlayer) => {
    return eachPlayer.match_id;
  });
  //console.log(`${matchIdArr}`);
  const getMatchDetailsQuery = `
    select * from match_details where match_id in (${matchIdArr});`;
  const getMatchDetails = await db.all(getMatchDetailsQuery);
  response.send(
    getMatchDetails.map((eachMatch) => convertDbToObjectAPI4(eachMatch))
  );
});

//API 6 GET
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    select *from player_match_score natural join player_details 
    where match_id = ${matchId};`;
  const playerArr = await db.all(getPlayersQuery);
  response.send(
    playerArr.map((eachPlayer) => convertDbObjectToAPI1(eachPlayer))
  );
});

//API 7 GET
const convertDbToObjectAPI7 = (playerName, objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: playerName,
    totalScore: objectItem.totalScore,
    totalFours: objectItem.totalFours,
    totalSixes: objectItem.totalSixes,
  };
};
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    select player_name from player_details where player_id = ${playerId};`;
  const getPlayerName = await db.get(getPlayerNameQuery);
  const getPlayerStatusQuery = `
    select player_id, sum(score) as totalScore, sum(fours) as totalFours, sum(sixes) as totalSixes
    from player_match_score where player_id = ${playerId};`;
  const getPlayerStatus = await db.get(getPlayerStatusQuery);
  response.send(
    convertDbToObjectAPI7(getPlayerName.player_name, getPlayerStatus)
  );
});
module.exports = app;
