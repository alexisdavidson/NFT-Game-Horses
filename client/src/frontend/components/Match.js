import { useState, useEffect } from 'react'
import { Row, Col, ProgressBar } from 'react-bootstrap'
import {useLocation} from 'react-router-dom';
import Axios from 'axios'
import attackIcon from '../images/attack.png'
import defenseIcon from '../images/defense.png'
import luckIcon from '../images/luck.png'
import configData from "./configData.json";
import configContract from "./configContract.json";
import { Unity, useUnityContext } from "react-unity-webgl";

const Match = (account) => {
    const [match, setMatch] = useState([])
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

    const { unityProvider, isLoaded, loadingProgression, sendMessage, addEventListener, removeEventListener } = useUnityContext({
        loaderUrl: "build/Build.loader.js",
        dataUrl: "build/Build.data",
        frameworkUrl: "build/Build.framework.js",
        codeUrl: "build/Build.wasm",
      });

    const handleRequestData = () => {
        sendMessage("GameController", "ReceiveReactData", 5410);
      }
      
    useEffect(() => {
        addEventListener("HandleRequestData", handleRequestData);
        return () => {
          removeEventListener("HandleRequestData", handleRequestData);
        };
      }, [addEventListener, removeEventListener, handleRequestData]);


    const loadingPercentage = Math.round(loadingProgression * 100);

    return (
        <div className="flex justify-center">
            <div className="pt-5 container">
                <Row>
                    {isLoaded === false && (
                        // We'll conditionally render the loading overlay if the Unity
                        // Application is not loaded.
                        <div className="loading-overlay">
                        <p>Loading... ({loadingPercentage}%)</p>
                        </div>
                    )}
                    <Unity unityProvider={unityProvider} style={{width: "1400px", height: "600px"}}/>
                </Row>
            </div>
        </div>
    );
}
export default Match