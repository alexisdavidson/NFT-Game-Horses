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

        // let playerNameElement = document.querySelector('.playerNameControl')
        // let playerName = playerNameElement.value.replace(/[^\w\s]/gi, '') // Remove special characters
        // console.log("Save username " + playerName);
        // localStorage.setItem('playerName', playerName);
        let playerName = "playerName"

        Axios.post(configData.SERVER_URL + 'api/pick_nft', {
            walletAddress1: account,
            horseId1: horseId,
            player1: playerName
        }).then((response) => {
            const serverResultType = response.data.serverResultType
            const serverResultValue = response.data.serverResultValue
            console.log("Server result type: " + serverResultType)
            console.log("Server result value: " + serverResultValue ?? "null")

            if (serverResultType == "COOLDOWN") {
                alert("This horse is on cooldown")
            }
            else if (serverResultType == "ALREADY_POOL") {
                alert("This horse is already in the matchmaking pool.")
            }
            else if (serverResultType == "JOINED_POOL") {
                routeChangeMatchmaking(horseId)
            }
            else if (serverResultType == "PLAY_MATCH") {
                routeChangeMatch(serverResultValue)
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
                {/* <Row>
                    <Col lg={4} className="g-4">
                        <Form className="pt-2 d-flex">
                            <Form.Group className="mb-3 pr-1" controlId="formPlayerName">
                                <Form.Control className="playerNameControl" type="text" placeholder="Enter player name" defaultValue={getPlayerNameFromStorage()} style={{width: "90%"}}/>
                            </Form.Group>
                        </Form>
                    </Col>
                </Row> */}

                {items.length > 0 ?
                    <Row xs={1} md={2} lg={4} className="g-4 pb-5 pt-5">
                        {items.map((item, idx) => (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
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
                        {/* <h2>Match History</h2> */}
                        <table className="table table-bordered table-striped table-light">
                            <thead>
                                <tr>
                                    <th scope="col">Replay</th>
                                    <th scope="col">Result</th>
                                    <th scope="col">Date</th>
                                    <th scope="col">Your Horse</th>
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
                                            <th scope="row">{val.winner == val.nft_id ? <b className="text-success">Victory!</b> : <span className="text-danger">Defeat</span>}</th>
                                            <td>{moment(val.date_played).format('MM/DD/YYYY hh:mm')}</td>
                                            <td>{val.nft_id}</td>
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