import { useState, useEffect } from 'react'
import { Row, Col, ProgressBar } from 'react-bootstrap'
import {useLocation} from 'react-router-dom';
import Axios from 'axios'
import attackIcon from '../images/attack.png'
import defenseIcon from '../images/defense.png'
import luckIcon from '../images/luck.png'
import configData from "./configData.json";
import configContract from "./configContract.json";

const Match = (account) => {
    const [match, setMatch] = useState([])
    const [loading, setLoading] = useState(true)
    const location = useLocation();
    const [items, setItems] = useState([])
    const [matchLength, setMatchLength] = useState([])
    const [matchInitiated, setMatchInitiated] = useState(false)
    const [startingHorse, setStartingHorse] = useState(0)

    let playedHorseId = 1
    let horseNoflip = null
    let horseFlip = null
    let currentActiveHorse = 0
    let displayOffset = 2
    let elementsShown = 0

    const typeToHealth = (breed) => {
        if (breed == "Green") {
            return 55
        }
        if (breed == "Gold") {
            return 60
        }
        if (breed == "Red") {
            return 70
        }
        
        return 50
    }

    const setCurrentActiveHorse = (activeHorse) => {
        console.log("setCurrentActiveHorse " + currentActiveHorse + " to " + activeHorse)
        currentActiveHorse = activeHorse
    }

    const loadOpenSeaItems = async (match) => {
        let horses = []
        horses.push(await fetch(`${configContract.OPENSEA_API}/asset/${configContract.CONTRACT_ADDRESS}/${match.horse1}`)
        .then((res) => res.json())
        .then((res) => { return res })
        .catch((e) => {
          console.error(e)
          console.error('Could not talk to OpenSea')
          return null
        }))

        horses.push(await fetch(`${configContract.OPENSEA_API}/asset/${configContract.CONTRACT_ADDRESS}/${match.horse2}`)
        .then((res) => res.json())
        .then((res) => { return res })
        .catch((e) => {
          console.error(e)
          console.error('Could not talk to OpenSea')
          return null
        }))

        if (horses[1].owner.account === account) playedHorseId = 2

        let items = []
        for(let i = 0; i < horses.length; i ++) {
            items.push({
                ImageUrl: horses[i].image_url,
                Health: typeToHealth(horses[i].traits.filter(e => e.trait_type == "Breed")[0].value),
                HealthMax: typeToHealth(horses[i].traits.filter(e => e.trait_type == "Breed")[0].value),
                Attack: horses[i].traits.filter(e => e.trait_type == "Attack")[0].value,
                Luck: horses[i].traits.filter(e => e.trait_type == "Luck")[0].value,
                Defense: horses[i].traits.filter(e => e.trait_type == "Defense")[0].value
            })
        }

        setLoading(false)
        setItems(items)
    }

    // const showHorses = () => {
    //     var elementResult = document.querySelector('.horse-hide');
    //     if (elementResult != null) {
    //         elementResult.classList.remove('horse-hide');
    //         elementResult.classList.add('linko-show');
    //         elementResult = document.querySelector('.horse-hide');
    //         elementResult.classList.remove('horse-hide');
    //         elementResult.classList.add('linko-show');
    //     }
    // }

    const attackText = (horseId) => {
        // console.log("horseId: " + horseId + ", playerHorseId: " + playedHorseId)
        if (horseId === playedHorseId)
            return "You attack"
        else return "Opponent attacks"
    }

    const goFirstText = (horseId) => {
        // console.log("horseId: " + horseId + ", playerHorseId: " + playedHorseId)
        if (horseId === playedHorseId)
            return "You go first!"
        else return "Opponent goes first!"
    }

    const defeatedText = () => {
        let race_log = JSON.parse(match.race_log)
        let lastHorseAttacking = race_log[race_log.length - 1].horse

        if (lastHorseAttacking === playedHorseId)
            return "You have defeated the opponent!"
        else return "You have been defeated."
    }

    const victoryOrDefeatText = () => {
        let race_log = JSON.parse(match.race_log)
        let lastHorseAttacking = race_log[race_log.length - 1].horse

        if (lastHorseAttacking === playedHorseId)
            return "Victory!"
        else return "Defeat."
    }

    const displayMatch = async () => {
        console.log("Display match " + location.state.matchId)

        Axios.get(configData.SERVER_URL + 'api/get_match', {
            params: {
                matchId: location.state.matchId
            }
        }).then((response) => {
            const matchTemp = response.data[0]
            setMatch(matchTemp)
            setMatchLength(JSON.parse(matchTemp.race_log).length)
            setStartingHorse(JSON.parse(matchTemp.race_log)[0].horse)

            console.log("matchTemp.race_log[0].horse: " + currentActiveHorse)
            console.log("Match winner is " + matchTemp.winner)

            loadOpenSeaItems(matchTemp)
        })
    }

    const updateHorseGlow = () => {
        console.log("updateHorseGlow, currentActiveHorse: " + currentActiveHorse)
        let horseGlow = document.querySelector('.horse-glow');
        if (horseGlow != null) horseGlow?.classList?.remove('horse-glow')

        if (currentActiveHorse === 1) {
            horseFlip.classList.add('horse-glow');
        }
        else {
            horseNoflip.classList.add('horse-glow');
        }
    }

    const startRaceEventAnimation = () => {
        // console.log("startRaceEventAnimation")
        // console.log(currentActiveHorse)
        // console.log(horseFlip)
        // console.log(horseNoflip)

        if (currentActiveHorse === 1) {
            horseFlip.classList.add('horse-flip-attack');
            horseNoflip.classList.add('horse-hurt');
        }
        else {
            horseNoflip.classList.add('horse-attack');
            horseFlip.classList.add('horse-flip-hurt');
        }
        
        setCurrentActiveHorse(1 - (currentActiveHorse - 1) + 1)

        setTimeout(function(){
            if (elementsShown - displayOffset < matchLength) {
                let horseAttack = document.querySelector('.horse-attack')
                if (horseAttack != null) horseNoflip.classList.remove('horse-attack');
                let horseHurt = document.querySelector('.horse-hurt')
                if (horseHurt != null) horseNoflip.classList.remove('horse-hurt');
                let horseFlipAttack = document.querySelector('.horse-flip-attack')
                if (horseFlipAttack != null) horseFlip.classList.remove('horse-flip-attack');
                let horseFlipHurt = document.querySelector('.horse-flip-hurt')
                if (horseFlipHurt != null) horseFlip.classList.remove('horse-flip-hurt');

                updateHorseGlow();
            }
        }, 1200);
    }

    const damageHorse = (horseId) => {
        setTimeout(function(){
            let attackValue = JSON.parse(match.race_log)[elementsShown - displayOffset - 1].attackValue
            console.log("attackValue: " + attackValue)
            
            items[horseId].Health -= attackValue
            if (items[horseId].Health < 0) items[horseId].Health = 0
            console.log("Horse " + horseId + ": " + items[horseId].Health)

            setItems([...items])
        }, 300);
    }

    const createIntervalLoop = () => {
        function displayText() {
            var element = document.querySelector('.linko-hide');
          
            if (null === element) {
                var elementResult = document.querySelector('.result-hide');
                if (elementResult != null) {
                    elementResult.classList.remove('result-hide');
                    elementResult.classList.add('linko-show');
                    elementResult = document.querySelector('.result-hide');
                    elementResult.classList.remove('result-hide');
                    elementResult.classList.add('linko-show');
                }
            } else {
                element.classList.remove('linko-hide');
                element.classList.add('linko-show');

                // console.log("element != null")
                // console.log("elementsShown: " + elementsShown)
                // console.log("displayOffset: " + displayOffset)
                // console.log("matchLength: " + matchLength)

                if (elementsShown >= displayOffset && elementsShown - displayOffset < matchLength) {
                    // console.log("Call startRaceEventAnimation")
                    startRaceEventAnimation()
                    damageHorse(currentActiveHorse - 1)
                }

                elementsShown += 1
            }
          }
          
          return setInterval(function () {
                displayText();
            }, 3000)
    }

    const clearAllIntervals = () => {
        const interval_id = setInterval(function(){}, Number.MAX_SAFE_INTEGER);
        for (let i = 1; i < interval_id; i++) {
            clearInterval(i);
        }
    }

    useEffect(() => {
        clearAllIntervals()
        displayMatch()
    }, [])

    useEffect(() => {
        if (!(matchInitiated === true) && startingHorse != 0 && items.length > 0 && matchLength > 0 && match != null && match != undefined) {
            console.log("items updated.")
            console.log(items)
            
            setCurrentActiveHorse(startingHorse)
            console.log("Horse to start is " + currentActiveHorse)
            horseFlip = document.querySelector('.horse-flip');
            horseNoflip = document.querySelector('.horse-noflip');
            updateHorseGlow()
            
            createIntervalLoop()

            setMatchInitiated(true)
        }
    }, [items, match, matchLength]);

    if (loading) return (
        <div className="flex justify-center">
            <h2>Fight!</h2>
        </div>
    )

    return (
        <div className="flex justify-center">
            {items.length > 0 ?
                <div className="px-5 container">
                    <Row>
                        <Col xs="3">
                            <p className="py-3">
                                {items[0].Attack} <img src={attackIcon} width="40"></img>
                                {items[0].Defense} <img src={defenseIcon} width="40"></img>
                                {items[0].Luck} <img src={luckIcon} width="40"></img>
                            </p>
                        </Col>
                        <Col><h2>Fight!</h2></Col>
                        <Col xs="3">
                            <p className="py-3">
                                {items[1].Attack} <img src={attackIcon} width="40"></img>
                                {items[1].Defense} <img src={defenseIcon} width="40"></img>
                                {items[1].Luck} <img src={luckIcon} width="40"></img>
                            </p>
                        </Col>
                    </Row>
                    {/* <p>Winner of match {location.state.matchId} is: {match.winner}</p> */}
                    {/* <p>Race log: {match.race_log}</p> */}
                    <Row>
                        <Col xs="3">
                            <img src={items[0].ImageUrl} width="300" className="horse-flip horse-glow"></img>
                            <Row>
                                <ProgressBar style={{marginTop: "40px", height:"40px", width:"100%", backgroundColor: "black", fontSize: "18px"}}
                                variant="danger" now={100 * items[0].Health / items[0].HealthMax} label={items[0].Health + '/' + items[0].HealthMax} />
                            </Row>
                            <div className='d-grid'>
                                <br/>
                                {match.winner === 1 ?
                                <h2 className="text-success linko result-hide">Victory</h2>
                                :
                                <h2 className="text-danger linko result-hide">Defeat</h2>
                                }
                            </div>
                            <div style={{textAlign: "center"}}>
                                <span style={{fontSize: "18px", fontWeight: "bold"}}>{match.player1}</span><br/>
                                <span style={{fontSize: "12px"}} className="text-dark">{match.wallet1}</span>
                            </div>
                        </Col>
                        
                        <Col xs="1"></Col>
                        <Col>
                            <p style={{textAlign:"left"}} className="linko linko-hide"> The Race Begins! </p>
                            <p style={{textAlign:"left"}} className="linko linko-hide"> {goFirstText(JSON.parse(match.race_log)[0].horse)} </p>
                            {JSON.parse(match.race_log).map((val) => {
                                return (
                                    <p style={{textAlign:"left"}} className="linko linko-hide">
                                        {
                                            attackText(val.horse)} for {val.attackValue} damage. {val.isCriticalStrike ? <b> Critical Strike! </b> : <span></span>
                                        }
                                    </p>
                                );
                            })}
                            <p style={{textAlign:"left"}} className="linko linko-hide"> {defeatedText()} </p>
                            <p style={{textAlign:"left"}} className="linko linko-hide"> {victoryOrDefeatText()} </p>
                        </Col>

                        <Col xs="3">
                            <img src={items[1].ImageUrl} width="300" className="horse-noflip"></img>
                            <Row>
                                <ProgressBar style={{marginTop: "40px", height:"40px", width:"100%", backgroundColor: "black", fontSize: "18px"}}
                                variant="danger" now={100 * items[1].Health / items[1].HealthMax} label={items[1].Health + '/' + items[1].HealthMax} />
                            </Row>
                            <div className='d-grid'>
                                <br/>
                                {match.winner === 2 ?
                                <h2 className="text-success linko result-hide">Victory</h2>
                                :
                                <h2 className="text-danger linko result-hide">Defeat</h2>
                                }
                            </div>
                            <div style={{textAlign: "center"}}>
                                <span style={{fontSize: "18px", fontWeight: "bold"}}>{match.player2}</span><br/>
                                <span style={{fontSize: "12px"}} className="text-dark">{match.wallet2}</span>
                            </div>
                        </Col>
                    </Row>
                    {/* <Row>
                        <h2>Race Summary</h2>
                        <table style={{textAlign:"center"}} className="table table-bordered table-striped table-dark">
                            <thead>
                                <tr>
                                    <th scope="col">Horse</th>
                                    <th scope="col">Attack</th>
                                </tr>
                            </thead>
                            <tbody>
                                {JSON.parse(match.race_log).map((val) => {
                                    return (
                                        <tr>
                                            <th scope="row">{val.horse}</th>
                                            <td>
                                                {val.isCriticalStrike ? 
                                                    <b> 
                                                        {val.attackValue}!
                                                    </b>
                                                :
                                                    <span> 
                                                        {val.attackValue}
                                                    </span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Row> */}
                </div>
            : (
                <main style={{ padding: "1rem 0" }}>
                    <h2>Loading...</h2>
                </main>
            )}
        </div>
    );
}
export default Match