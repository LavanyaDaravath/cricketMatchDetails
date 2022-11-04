const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const app = express();
app.use(express.json());

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
    console.log(`DB is Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Returns a list of all the players in the player table
//GET player API1
const convertPlayerAPI1 = (dbPlayerList) => {
  return {
    playerId: dbPlayerList.player_id,
    playerName: dbPlayerList.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const selectPlayer = `select * from player_details;`;
  const playerQuery = await db.all(selectPlayer);
  response.send(playerQuery.map((eachList) => convertPlayerAPI1(eachList)));
});

//API2
//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `SELECT 
      *
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player_1_ID = await db.get(playerDetails);
  response.send(convertPlayerAPI1(player_1_ID));
});

//Updates the details of a specific player based on the player ID
//API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerName = `update player_details set player_name = '${playerName}'
    where player_id = ${playerId};`;
  await db.run(updatePlayerName);
  response.send(`Player Details Updated`);
});

//Returns the match details of a specific match
//API4
const convertMatchAPI4 = (dbMatchList) => {
  return {
    matchId: dbMatchList.match_id,
    match: dbMatchList.match,
    year: dbMatchList.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `select * from match_details where match_id = ${matchId};`;
  const getMatchId = await db.get(getMatchQuery);
  response.send(convertMatchAPI4(getMatchId));
});

//Returns a list of all the matches of a player
//API5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `select 
  * from player_match_score 
  natural join match_details 
  where player_id = ${playerId};`;
  const playerAndMatch = await db.all(getPlayerMatchQuery);
  response.send(playerAndMatch.map((eachMatch) => convertMatchAPI4(eachMatch)));
});

//Returns a list of players of a specific match
//API6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `select * from player_match_score 
     natural join player_details where match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayerQuery);
  response.send(
    playersArray.map((eachPlayersObject) =>
      convertPlayerAPI1(eachPlayersObject)
    )
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
//API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchAndPlayers = `
    select player_id as playerId,
    player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    from player_match_score
    natural join player_details
    where player_id = ${playerId};
    `;
  const matchAndPlayerDetails = await db.get(getMatchAndPlayers);
  response.send(matchAndPlayerDetails);
});

module.exports = app;
