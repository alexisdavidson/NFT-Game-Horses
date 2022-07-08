import express from 'express'
import mysql from 'mysql'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import moment from 'moment'
import { race } from './race.js'

const app = express()

dotenv.config()

const db = mysql.createPool({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DB
})

const canFightOwnWallet = process.env.CANFIGHTOWNWALLET

app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/api/get_matchmaking_pool', (req, res) => {
    const sqlSelect = "SELECT * FROM matchmaking_pool;"
    
    db.query(sqlSelect, (err, result) => {
        if (err) console.log(err)
        if (result) console.log(result)

        res.send(result)
    })
})

app.get('/api/get_match_history', (req, res) => {
    let sqlSelect = "SELECT * FROM match_history"

    const walletAddress = req.query.walletAddress
    const lettersAndNumbersPattern = /^[a-z0-9]+$/;
    if(walletAddress != undefined && walletAddress != null && !walletAddress.match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. No special characters and no numbers, please!"})

    if (walletAddress != undefined && walletAddress != null) sqlSelect += " WHERE wallet1 = '" + walletAddress + "' OR wallet2 = '" + walletAddress + "'"
    sqlSelect += " ORDER BY id DESC"
    if (walletAddress != undefined && walletAddress != null) sqlSelect += " LIMIT 10"
    sqlSelect += ";"
    
    db.query(sqlSelect, (err, result) => {
        if (err) console.log(err)
        if (result) console.log(result)

        res.send(result)
    })
})

// Get opponent from matchmaking pool
app.get('/api/get_opponent', (req, res) => {
    const walletAddress = req.query.walletAddress
    const horseId = req.query.horseId

    const lettersAndNumbersPattern = /^[a-z0-9]+$/;
    if(walletAddress != undefined && walletAddress != null && !walletAddress.match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. walletAddress no special characters and no numbers, please!"})

    const numbersPattern = /^[0-9]+$/;
    if(horseId != undefined && horseId != null && !horseId.toString().match(numbersPattern))
        return res.status(400).json({ err: "Invalid input. horseId only numbers!"})

    let sqlSelect = "SELECT * FROM matchmaking_pool WHERE wallet_address != ? AND horse_id != ? LIMIT 1;"
    if (canFightOwnWallet === "TRUE") {
        sqlSelect = "SELECT * FROM matchmaking_pool WHERE horse_id != ? AND horse_id != ? LIMIT 1;"
    }
    
    db.query(sqlSelect, [walletAddress, horseId], (err, result) => {
        if (err) console.log(err)
        if (result) console.log(result)

        res.send(result)
    })
})

app.post('/api/join_matchmaking_pool', (req, res) => {
    const walletAddress = req.body.walletAddress
    const horseId = req.body.horseId
    const playerName = req.body.playerName

    const lettersAndNumbersPattern = /^[a-zA-Z0-9]+$/;
    if(walletAddress != undefined && walletAddress != null && !walletAddress.match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. walletAddress no special characters and no numbers, please!"})

    const numbersPattern = /^[0-9]+$/;
    if(horseId != undefined && horseId != null && !horseId.toString().match(numbersPattern))
        return res.status(400).json({ err: "Invalid input. horseId only numbers!"})

    if(playerName != undefined && playerName != null && !playerName.toString().match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. playerName no special characters and no numbers, please!"})

    let sqlSelect = "SELECT * FROM matchmaking_pool WHERE wallet_address = ? AND horse_id = ? LIMIT 1;"
    
    db.query(sqlSelect, [walletAddress, horseId], (err, result) => {
        if (err) console.log(err)
        if (result) {
            console.log(result)
            if (result.length > 0) {
                console.log("Found horseId already in pool")
                result[0] = true
                res.send(result)
            }
            else {
                const sqlInsert = "INSERT INTO matchmaking_pool (wallet_address, horse_id, date_joined, player_name) VALUES (?, ?, '" + moment.utc().format('YYYY-MM-DD HH:mm:ss') + "', ?);"
                db.query(sqlInsert, [walletAddress, horseId, playerName], (err2, result2) => {
                    if (err2) console.log(err2)
                    if (result2) console.log(result2.insertId)
            
                    res.send(result2)
                })
            }
        }
    })
})

app.post('/api/play_match', async (req, res) => {
    const walletAddress1 = req.body.walletAddress1
    const walletAddress2 = req.body.walletAddress2
    const horseId1 = req.body.horseId1
    const horseId2 = req.body.horseId2
    const player1 = req.body.player1
    const player2 = req.body.player2
    let err = ""
    console.log("Call play match " + walletAddress1 + " (" + horseId1 + ") vs " + walletAddress2 + " (" + horseId2 + ")")

    const lettersAndNumbersPattern = /^[a-zA-Z0-9]+$/;
    if(walletAddress1 != undefined && walletAddress1 != null && !walletAddress1.match(lettersAndNumbersPattern)) {
        err = "Invalid input. walletAddress1 no special characters and no numbers, please!"
        console.log(err)
        return res.status(400).json({ err: err})
    }
    if(walletAddress2 != undefined && walletAddress2 != null && !walletAddress2.match(lettersAndNumbersPattern)) {
        err = "Invalid input. walletAddress2 no special characters and no numbers, please!"
        console.log(err)
        return res.status(400).json({ err: err})
    }
    if(player1 != undefined && player1 != null && !player1.toString().match(lettersAndNumbersPattern) && player1.length != 0) {
        err = "Invalid input. player1 no special characters and no numbers, please!"
        console.log(err + ": " + player1)
        return res.status(400).json({ err: err})
    }

    const numbersPattern = /^[0-9]+$/;
    if(horseId1 != undefined && horseId1 != null && !horseId1.toString().match(numbersPattern))
        return res.status(400).json({ err: "Invalid input. horseId1 only numbers!"})
    if(horseId2 != undefined && horseId2 != null && !horseId2.toString().match(numbersPattern))
        return res.status(400).json({ err: "Invalid input. horseId2 only numbers!"})

    const raceLog = await race(horseId1, horseId2)
    if (raceLog == null) {
        console.log("raceLog is null")
        return;
    }

    const winner = raceLog.winner
    delete raceLog["winner"]
    console.log("raceLog:")
    console.log(raceLog)

    const sqlInsert = "INSERT INTO match_history (wallet1, wallet2, horse1, horse2, race_log, winner, date_played, player1, player2) VALUES (?, ?, ?, ?, ?, ?, '" + moment.utc().format('YYYY-MM-DD HH:mm:ss') + "', ?, ?);"
    db.query(sqlInsert, [walletAddress1, walletAddress2, horseId1, horseId2, JSON.stringify(raceLog), winner, player1, player2], (err, result) => {
        if (err) console.log(err)
        if (result) {
            const sqlDelete = "DELETE FROM matchmaking_pool WHERE (wallet_address = ? AND horse_id = ?) OR (wallet_address = ? AND horse_id = ?);"
            db.query(sqlDelete, [walletAddress1, horseId1, walletAddress2, horseId2], (err2, result2) => {
                if (err2) console.log(err2)
                if (result2) {
                    console.log(result)
                    console.log(result2)
                    console.log(result.insertId)
                    res.send([result.insertId])
                }
            })
        }
    })
})

app.get('/api/get_match', (req, res) => {
    const matchId = req.query.matchId

    const numbersPattern = /^[0-9]+$/;
    if(matchId != undefined && matchId != null && !matchId.toString().match(numbersPattern))
        return res.status(400).json({ err: "Invalid input. matchId only numbers!"})

    console.log("Get Match " + matchId)

    const sqlSelect = "SELECT * FROM match_history WHERE id = ? LIMIT 1;"
    
    db.query(sqlSelect, [matchId], (err, result) => {
        if (err) console.log(err)
        if (result) console.log(result)

        res.send(result)
    })
})

app.listen(process.env.PORT, () => {
    console.log('Running on port ' + process.env.PORT)
})