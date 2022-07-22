import { useState, useEffect } from 'react'
import { Row } from 'react-bootstrap'
import {useLocation} from 'react-router-dom';
import Axios from 'axios'
import configData from "./configData.json";
import { Unity, useUnityContext } from "react-unity-webgl";

const Match = () => {
    const location = useLocation();

    const { unityProvider, isLoaded, loadingProgression, sendMessage, addEventListener, removeEventListener } = useUnityContext({
        loaderUrl: "build/Build.loader.js",
        dataUrl: "build/Build.data",
        frameworkUrl: "build/Build.framework.js",
        codeUrl: "build/Build.wasm",
      });

    const handleRequestData = () => {
        
        Axios.get(configData.SERVER_URL + 'api/get_match', {
            params: {
                matchId: location.state.matchId
            }
        }).then((response) => {
            const matchTemp = response.data[0]

            console.log("matchTemp: " + matchTemp)
            console.log("Match finishers are " + matchTemp.race_log)

            sendMessage("GameController", "ReceiveReactData", matchTemp.race_log);
        })
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