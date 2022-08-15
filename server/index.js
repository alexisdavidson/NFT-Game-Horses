import express from 'express'
import mysql from 'mysql'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import moment from 'moment'
import { race, tokenIdBelongstoAddress } from './race.js'

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
    const sqlSelect = "SELECT * FROM match_players WHERE match_id IS NULL;"
    
    db.query(sqlSelect, (err, result) => {
        if (err) console.log(err)
        if (result) console.log(result)

        res.send(result)
    })
})

app.get('/api/get_match_history', (req, res) => {
    const walletAddress = req.query.walletAddress
    const lettersAndNumbersPattern = /^[a-z0-9]+$/;
    if(walletAddress != undefined && walletAddress != null && !walletAddress.match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. No special characters and no numbers, please!"})

        let sqlSelect = "SELECT match_history.id, match_history.winner, match_history.date_played, match_players.nft_id FROM match_history INNER JOIN match_players ON match_history.id = match_players.match_id"

    if (walletAddress != undefined && walletAddress != null) sqlSelect += " WHERE match_players.wallet_address = '" + walletAddress + "'"
    sqlSelect += " ORDER BY match_history.id DESC"
    if (walletAddress != undefined && walletAddress != null) sqlSelect += " LIMIT " + process.env.MATCHHISTORYCOUNT
    sqlSelect += ";"
    
    db.query(sqlSelect, (err, result) => {
        if (err) console.log(err)
        if (result) console.log(result)

        res.send(result)
    })
})

app.post('/api/pick_nft', async (req, res) => {
    const walletAddress1 = req.body.walletAddress1
    const nftId1 = req.body.horseId1
    const player1 = req.body.player1

    // Security - Input verification
    const lettersAndNumbersPattern = /^[a-zA-Z0-9]+$/;
    if(walletAddress1 != undefined && walletAddress1 != null && !walletAddress1.match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. walletAddress no special characters and no numbers, please!"})

    const numbersPattern = /^[0-9]+$/;
    if(nftId1 != undefined && nftId1 != null && !nftId1.toString().match(numbersPattern))
        return res.status(400).json({ err: "Invalid input. nftId only numbers!"})

    if(player1 != undefined && player1 != null && !player1.toString().match(lettersAndNumbersPattern))
        return res.status(400).json({ err: "Invalid input. playerName no special characters and no numbers, please!"})

    // Verify if this token Id belongs to this wallet address
    if (await tokenIdBelongstoAddress(nftId1, walletAddress1) === false)
        return res.status(400).json({ err: "This NFT does not belong to this wallet!"})
    
    // Check cooldown for the nft
    let cooldownReady = true
    const playCooldown = process.env.PLAYCOOLDOWN // in minutes
    let sqlSelect = "SELECT * FROM match_history INNER JOIN match_players ON match_history.id = match_players.match_id WHERE match_players.nft_id = '" + nftId1 + "' AND TIMESTAMPDIFF(MINUTE, '" + dateNow() + "', match_history.date_played) < " + playCooldown + " LIMIT 1;"
    
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
            // Check if enough opponents are in the matchmaking pool
            sqlSelect = "SELECT * FROM match_players WHERE match_id IS NULL AND wallet_address != ? AND nft_id != ? ORDER BY id LIMIT " + process.env.MAXPLAYERS + ";"
            if (canFightOwnWallet === "TRUE") {
                sqlSelect = "SELECT * FROM match_players WHERE match_id IS NULL AND nft_id != ? AND nft_id != ? ORDER BY id LIMIT " + process.env.MAXPLAYERS + ";"
            }
            
            db.query(sqlSelect, [walletAddress1, nftId1], async (err, resultOpponents) => {
                if (err) console.log(err)

                // If enough opponents found, play match
                if (resultOpponents != null && resultOpponents.length >= process.env.MINPLAYERS - 1) {
                    console.log(resultOpponents)
                    
                    let nftList = [parseInt(nftId1)]
                    for(let i = 0; i < resultOpponents.length; i ++) {
                        nftList.push(resultOpponents[i].nft_id);
                    }

                    const raceLog = await race(nftList)
                    if (raceLog != null) {
                        const winner = raceLog.winner
                        delete raceLog["winner"]
                        console.log("winner: " + winner)
                        console.log("raceLog:")
                        console.log(raceLog)

                        const sqlInsert = "INSERT INTO match_history (race_log, winner, date_played) VALUES (?, ?, '" + dateNow() + "');"
                        db.query(sqlInsert, [JSON.stringify(raceLog.finishers), winner], (err, result) => {
                            if (err) console.log(err)
                            if (result) {
                                const matchId = result.insertId

                                const sqlInsert = "INSERT INTO match_players (wallet_address, nft_id, player_name, match_id) VALUES (?, ?, ?, ?);"
                                db.query(sqlInsert, [walletAddress1, nftId1, player1, matchId], (err2) => {
                                    if (err2) console.log(err2)
                                })

                                let listString = ""
                                for(let i = 0; i < resultOpponents.length; i ++) {
                                    listString += resultOpponents[i].nft_id
                                    if (i != resultOpponents.length - 1) {
                                        listString +=", "
                                    }
                                }

                                const sqlUpdate = "UPDATE match_players SET match_id = ? WHERE match_id IS NULL AND nft_id IN (" + listString + ");"
                                db.query(sqlUpdate, [matchId], (err2, result2) => {
                                    if (err2) console.log(err2)
                                    if (result2) {
                                        console.log(result)
                                        console.log(result2)
                                        console.log(matchId)
                                        
                                        let toReturn = {}
                                        toReturn.serverResultValue = matchId
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
                    sqlSelect = "SELECT * FROM match_players WHERE match_id IS NULL AND wallet_address = ? AND nft_id = ? LIMIT 1;"
                    
                    db.query(sqlSelect, [walletAddress1, nftId1], (err, result) => {
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
                                const sqlInsert = "INSERT INTO match_players (wallet_address, nft_id, player_name) VALUES (?, ?, ?);"
                                db.query(sqlInsert, [walletAddress1, nftId1, player1], (err2, result2) => {
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