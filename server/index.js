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

const dateNow = () => moment.utc().format('YYYY-MM-DD HH:mm:ss')

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

app.post('/api/pick_nft', async (req, res) => {
    const walletAddress1 = req.body.walletAddress1
    const horseId1 = req.body.horseId1
    const player1 = req.body.player1

    // Security - Input verification
    const lettersAndNumbersPattern = /^[a-zA-Z0-9]+$/;
    if(walletAddress1 != undefined && walletAddress1 != null && !walletAddress1.match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. walletAddress no special characters and no numbers, please!"})

    const numbersPattern = /^[0-9]+$/;
    if(horseId1 != undefined && horseId1 != null && !horseId1.toString().match(numbersPattern))
        return res.status(400).json({ err: "Invalid input. horseId only numbers!"})

    if(player1 != undefined && player1 != null && !player1.toString().match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. playerName no special characters and no numbers, please!"})
    
    // Check cooldown for the nft
    let cooldownReady = true
    const playCooldown = process.env.PLAYCOOLDOWN // in minutes
    let sqlSelect = "SELECT * FROM match_history WHERE (horse1 = '" + horseId1 + "' OR horse2 = '" + horseId1 + "') AND TIMESTAMPDIFF(MINUTE, '" + dateNow() + "', date_played) < " + playCooldown + " LIMIT 1;"
    
    db.query(sqlSelect, async (err, result) => {
        if (err) console.log(err)
        if (result != null && result.length > 0 && playCooldown > 0) {
            console.log("Cooldown not ready")

            cooldownReady = false

            let toReturn = {}
            toReturn.serverResultValue = result
            toReturn.serverResultType = "COOLDOWN"
            res.send(toReturn)
            res.end()
        }
        
        if (cooldownReady) {
            // Check if opponent is in the matchmaking pool
            let walletAddress2 = ""
            let horseId2 = -1
            let player2 = ""
            sqlSelect = "SELECT * FROM matchmaking_pool WHERE wallet_address != ? AND horse_id != ? LIMIT 1;"
            if (canFightOwnWallet === "TRUE") {
                sqlSelect = "SELECT * FROM matchmaking_pool WHERE horse_id != ? AND horse_id != ? LIMIT 1;"
            }
            
            db.query(sqlSelect, [walletAddress1, horseId1], async (err, result) => {
                if (err) console.log(err)
                if (result) {
                    console.log(result)
                    if (result != null && result.length > 0) {
                        walletAddress2 = result[0].wallet_address
                        horseId2 = result[0].horse_id
                        player2 = result[0].player_name
                    }
                }

                // If opponent found, play match
                if (horseId2 != -1) {
                    console.log("Call play match " + walletAddress1 + " (" + horseId1 + ") vs " + walletAddress2 + " (" + horseId2 + ")")
                        
                    const raceLog = await race(horseId1, horseId2)
                    if (raceLog != null) {
                        const winner = raceLog.winner
                        delete raceLog["winner"]
                        console.log("raceLog:")
                        console.log(raceLog)

                        const sqlInsert = "INSERT INTO match_history (wallet1, wallet2, horse1, horse2, race_log, winner, date_played, player1, player2) VALUES (?, ?, ?, ?, ?, ?, '" + dateNow() + "', ?, ?);"
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
                                        
                                        let toReturn = {}
                                        toReturn.serverResultValue = result.insertId
                                        toReturn.serverResultType = "PLAY_MATCH" 
                                        res.send(toReturn)
                                        return
                                    }
                                })
                            }
                        })
                    } else {
                        console.log("raceLog is null")
                    }
                } else {
                    // If no opponent found, join matchmaking pool
                    // Check already in matchmaking_pool
                    sqlSelect = "SELECT * FROM matchmaking_pool WHERE wallet_address = ? AND horse_id = ? LIMIT 1;"
                    
                    db.query(sqlSelect, [walletAddress1, horseId1], (err, result) => {
                        if (err) console.log(err)
                        if (result) {
                            console.log(result)
                            if (result.length > 0) {
                                console.log("Found horseId already in pool")
                                
                                let toReturn = {}
                                toReturn.serverResultType = "ALREADY_POOL"
                                res.send(toReturn)
                            }
                            else {
                                const sqlInsert = "INSERT INTO matchmaking_pool (wallet_address, horse_id, date_joined, player_name) VALUES (?, ?, '" + dateNow() + "', ?);"
                                db.query(sqlInsert, [walletAddress1, horseId1, player1], (err2, result2) => {
                                    if (err2) console.log(err2)
                                    if (result2) {
                                        console.log("insertId: " + result2.insertId)

                                        let toReturn = {}
                                        toReturn.serverResultValue = result2.insertId
                                        toReturn.serverResultType = "JOINED_POOL"
                                        res.send(toReturn)
                                        return
                                    }
                            
                                })
                            }
                        }
                    })
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