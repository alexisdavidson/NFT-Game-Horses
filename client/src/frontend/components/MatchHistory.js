import { useState, useEffect } from 'react'
import { Button } from 'react-bootstrap'
import { useNavigate } from "react-router-dom";
import Axios from 'axios'
import configData from "./configData.json";

const MatchHistory = () => {
    let navigate = useNavigate(); 
    const routeChangeMatch = (matchId) =>{ 
        let path = '/match'; 
        console.log("Navigate to match " + matchId)
        navigate(path, {
            state: {
                matchId: matchId
            }
        });
    }

    const [matchHistory, setMatchHistory] = useState([])

    const displayMatchHistory = async () => {
        Axios.get(configData.SERVER_URL + 'api/get_match_history').then((response) => {
            setMatchHistory(response.data)
        })
        .catch((error) => {
            console.log(error);
            console.log(error.response);
        })
    }
    const submitWatchRace = (matchId) => {
        console.log("Watch race of match id " + matchId)
        routeChangeMatch(matchId)
    }

    useEffect(() => {
        displayMatchHistory()
    }, [])

    return (
        <div className="flex justify-center">
            <h2>Match History</h2>
            <table className="table table-bordered table-striped table-light">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Replay</th>
                        <th scope="col">Player 1</th>
                        <th scope="col">Player 2</th>
                        <th scope="col">Horse 1</th>
                        <th scope="col">Horse 2</th>
                        <th scope="col">Winner</th>
                        <th scope="col">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {matchHistory != null && matchHistory.length > 0 ? matchHistory.map((val) => {
                        return (
                            <tr>
                                <td>
                                    <Button className="py-0" variant="secondary" size="sm" onClick={() => submitWatchRace(val.id)}>
                                        Replay
                                    </Button>
                                </td>
                                <th scope="row">{val.id}</th>
                                <td>{val.wallet1}</td>
                                <td>{val.wallet2}</td>
                                <td>{val.horse1}</td>
                                <td>{val.horse2}</td>
                                <td>{val.winner}</td>
                                <td>{val.date_played}</td>
                            </tr>
                        );
                    })
                    : <span />
                }
                </tbody>
            </table>
        </div>
    );
}
export default MatchHistory