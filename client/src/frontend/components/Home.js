import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Form } from 'react-bootstrap'
import { useNavigate } from "react-router-dom";
import Axios from 'axios'
import moment from 'moment'
import configData from "./configData.json";
import configContract from "./configContract.json";

const Home = ({ account }) => {
    let navigate = useNavigate(); 
    const routeChangeMatch = (matchId) =>{ 
        let path = '/match'; 
        console.log("Navigate to match " + matchId)
        navigate(path, {
            state: {
                matchId: matchId,
                account: account
            }
        });
    }
    const routeChangeMatchmaking = (horse) =>{ 
        let path = 'matchmaking'; 
        navigate(path, {
            state: {
                horse: horse
            }
        });
    }

    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState([])
    const [matchHistory, setMatchHistory] = useState([])

    const displayMatchHistory = async () => {
        Axios.get(configData.SERVER_URL + 'api/get_match_history', {
            params: {
                walletAddress: account
            },
          }).then((response) => {
            setMatchHistory(response.data)
        })
    }

    const submitWatchRace = (matchId) => {
        console.log("Watch race of match id " + matchId)
        routeChangeMatch(matchId)
    }

    const getPlayerNameFromStorage = () => {
        // localStorage.removeItem('playerName')
        if (localStorage.getItem('playerName') === null) 
            return ""
        return localStorage.getItem('playerName')
    }

    const submitPick = (horseId) => {
        console.log("Pick horse " + horseId);

        let playerNameElement = document.querySelector('.playerNameControl')
        let playerName = playerNameElement.value.replace(/[^\w\s]/gi, '') // Remove special characters
        console.log("Save username " + playerName);
        localStorage.setItem('playerName', playerName);
        
        Axios.get(configData.SERVER_URL + 'api/get_opponent', {
            params: {
                walletAddress: account,
                horseId: horseId
            },
          }).then((response) => {
            if (response.data.length == 0) {
                // No suitable opponent in matchmaking pool -> join the pool 
                console.log("No opponent found. Joining matchmaking pool")
                Axios.post(configData.SERVER_URL + 'api/join_matchmaking_pool', {
                    walletAddress: account,
                    horseId: horseId,
                    playerName: playerName
                }).then((response) => {
                    if (response.data[0] == true) {
                        console.log("Already in matchmaking pool.")
                        alert("This horse is already in the matchmaking pool.")
                    }
                    else {
                        console.log("Matchmaking pool joined.")
                        routeChangeMatchmaking(horseId)
                    }
                    console.log(response)
                })
            }
            else {
                // Suitable opponent found -> play match
                console.log(response.data)
                
                console.log("Opponent found. Starting match against " + response.data[0].horse_id + ", " + response.data[0].wallet_address)
                
                Axios.post(configData.SERVER_URL + 'api/play_match', {
                    walletAddress1: account,
                    horseId1: horseId,
                    player1: playerName,
                    walletAddress2: response.data[0].wallet_address,
                    horseId2: response.data[0].horse_id,
                    player2: response.data[0].player_name
                }).then((response) => {
                    console.log("Play match result: ")
                    let matchId = response.data[0]
                    console.log(matchId)
                    
                    routeChangeMatch(matchId)
                })

            }
        })
        
    }

    const loadOpenSeaItems = async () => {
        let items = await fetch(`${configContract.OPENSEA_API}/assets?owner=${account}&asset_contract_address=${configContract.CONTRACT_ADDRESS}&format=json`)
        // let items = await fetch(`${configContract.OPENSEA_API}/assets?asset_contract_address=${configContract.CONTRACT_ADDRESS}&format=json`)
        .then((res) => res.json())
        .then((res) => {
          return res.assets
        })
        .catch((e) => {
          console.error(e)
          console.error('Could not talk to OpenSea')
          return null
        })

        setLoading(false)
        setItems(items)
    }

    useEffect(() => {
        loadOpenSeaItems()
        displayMatchHistory()
    }, [])

    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
        </main>
    )

    return (
        <div className="flex justify-center">
            <div className="px-5 container">
                <Row>
                    <Col lg={4} className="g-4">
                        <Form className="pt-2 d-flex">
                            <Form.Group className="mb-3 pr-1" controlId="formPlayerName">
                                <Form.Control className="playerNameControl" type="text" placeholder="Enter player name" defaultValue={getPlayerNameFromStorage()} style={{width: "90%"}}/>
                            </Form.Group>
                            {/* <Button variant="success" type="submit" style={{height: "50%"}}>Save</Button> */}
                        </Form>
                    </Col>
                </Row>

                {items.length > 0 ?
                    <Row xs={1} md={2} lg={4} className="g-4 pb-5 pt-3">
                        {items.map((item, idx) => (
                            <Col key={idx} className="overflow-hidden">
                                <Card bg="dark">
                                    <Card.Img variant="top" src={item.image_url} />
                                    <Card.Body color="secondary">
                                    <Card.Title>{item.name}</Card.Title>
                                    <Card.Text>
                                        Breed: {item.traits.filter(e => e.trait_type == "breed")[0]?.value}
                                        {/* <br/>
                                        Alertness: {item.traits.filter(e => e.trait_type == "Alertness")[0]?.value}
                                        <br/>
                                        Adaptibility: {item.traits.filter(e => e.trait_type == "Adaptibility")[0]?.value}
                                        <br/>
                                        Strength: {item.traits.filter(e => e.trait_type == "Strength")[0]?.value}
                                        <br/>
                                        Pedigree: {item.traits.filter(e => e.trait_type == "Pedigree")[0]?.value}
                                        <br/>
                                        Stamina: {item.traits.filter(e => e.trait_type == "Stamina")[0]?.value}
                                        <br/>
                                        Instability: {item.traits.filter(e => e.trait_type == "Instability")[0]?.value} */}
                                    </Card.Text>
                                    </Card.Body>
                                    <Card.Footer>
                                    <div className='d-grid'>
                                        <Button variant="success" size="lg" onClick={() => submitPick(item.token_id)}>
                                            Pick
                                        </Button>
                                    </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                : (
                    <main style={{ padding: "1rem 0" }}>
                        <h2>No listed assets for {account}</h2>
                    </main>
                )}
                
                {matchHistory.length > 0 ?
                    <Row>
                        <h2>Match History</h2>
                        <table className="table table-bordered table-striped table-dark">
                            <thead>
                                <tr>
                                    <th scope="col">Replay</th>
                                    <th scope="col">Result</th>
                                    <th scope="col">Date</th>
                                    <th scope="col">Opponent</th>
                                    <th scope="col">Your Horse</th>
                                    <th scope="col">Opponent's Horse</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matchHistory.map((val) => {
                                    return (
                                        <tr>
                                            <td>
                                                <Button className="py-0" variant="secondary" size="sm" onClick={() => submitWatchRace(val.id)}>
                                                    Replay
                                                </Button>
                                            </td>
                                            <th scope="row">{val.wallet1 == account ? (val.winner == 1 ? <b className="text-success">Victory!</b> : <span className="text-danger">Defeat</span>) 
                                                : (val.winner == 2 ? <b className="text-success">Victory!</b> : <span className="text-danger">Defeat</span>)}</th>
                                            <td>{moment(val.date_played).format('MM/DD/YYYY hh:mm')}</td>
                                            <td>{val.wallet1 == account ? val.wallet2 : val.wallet1}</td>
                                            <td>{val.wallet1 == account ? val.horse1 : val.horse2}</td>
                                            <td>{val.wallet1 == account ? val.horse2 : val.horse1}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Row>
                : 
                    <div></div>
                }
            </div>
        </div>
    );
}
export default Home