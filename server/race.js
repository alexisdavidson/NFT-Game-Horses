import Web3 from 'web3'
import OpenSea from 'opensea-js'
import dotenv from 'dotenv'
import configContract from "./configContract.json" assert {type: "json"};

dotenv.config()

const provider = new Web3.providers.HttpProvider('https://mainnet.infura.io')

const seaport = new OpenSea.OpenSeaPort(provider, {
  networkName: OpenSea.Network.Main,
  apiKey: process.env.OPENSEAAPIKEY
})


export const race = async function(horseId1, horseId2) {
    console.log("race " + horseId1 + " vs " + horseId2)

    let horses = await fetchHorses(horseId1, horseId2)
    if (horses == null || horses[0] == null || horses[1] == null) return null

    // console.log(horses[0])
    // console.log(horses[1])

    let raceLog = []
    let horseAttacking = Math.floor(Math.random() * 2)

    // while(horses[0].Health > 0 && horses[1].Health > 0) {
    //     let isCriticalStrike = Math.floor(Math.random() * 100) < horses[horseAttacking].Luck * 5
    //     let attackValue = Math.floor(Math.random() * 20) + horses[horseAttacking].Attack + (isCriticalStrike ? 5 : 0)
    //     attackValue -= horses[1 - horseAttacking].Defense
    //     if (attackValue < 0) {
    //         attackValue = 0
    //     }

    //     let raceAction = {
    //         horse: horseAttacking + 1,
    //         attackValue: attackValue,
    //         isCriticalStrike: isCriticalStrike
    //     }

    //     horses[1 - horseAttacking].Health -= attackValue

    //     raceLog.push(raceAction)
    //     horseAttacking = 1 - horseAttacking
    // }

    // raceLog.winner = horses[0].Health <= 0 ? 2 : 1
    raceLog.winner = 1

    return raceLog
}

async function fetchHorses(horseId1, horseId2) {
    let horses = []

    // horses.push({
    //     "traits": [
    //         {
    //             "trait_type": "Breed",
    //             "value": "Green",
    //             "display_type": null,
    //             "max_value": null,
    //             "trait_count": 298,
    //             "order": null
    //         },
    //         {
    //             "trait_type": "Rarity",
    //             "value": "Common",
    //             "display_type": null,
    //             "max_value": null,
    //             "trait_count": 498,
    //             "order": null
    //         },
    //         {
    //             "trait_type": "Defense",
    //             "value": 8,
    //             "display_type": "number",
    //             "max_value": null,
    //             "trait_count": 106,
    //             "order": null
    //         },
    //         {
    //             "trait_type": "Luck",
    //             "value": 2,
    //             "display_type": "number",
    //             "max_value": null,
    //             "trait_count": 98,
    //             "order": null
    //         },
    //         {
    //             "trait_type": "Attack",
    //             "value": 10,
    //             "display_type": "number",
    //             "max_value": null,
    //             "trait_count": 107,
    //             "order": null
    //         }
    //     ],
    // })
    // horses.push({
    //     "traits": [
    //         {
    //             "trait_type": "Breed",
    //             "value": "Grey",
    //             "display_type": null,
    //             "max_value": null,
    //             "trait_count": 600,
    //             "order": null
    //         },
    //         {
    //             "trait_type": "Rarity",
    //             "value": "Rare",
    //             "display_type": null,
    //             "max_value": null,
    //             "trait_count": 335,
    //             "order": null
    //         },
    //         {
    //             "trait_type": "Luck",
    //             "value": 2,
    //             "display_type": "number",
    //             "max_value": null,
    //             "trait_count": 98,
    //             "order": null
    //         },
    //         {
    //             "trait_type": "Attack",
    //             "value": 10,
    //             "display_type": "number",
    //             "max_value": null,
    //             "trait_count": 107,
    //             "order": null
    //         },
    //         {
    //             "trait_type": "Defense",
    //             "value": 1,
    //             "display_type": "number",
    //             "max_value": null,
    //             "trait_count": 88,
    //             "order": null
    //         }
    //     ],
    // })

    horses.push(await seaport.api.getAsset({
        tokenAddress: configContract.CONTRACT_ADDRESS,
        tokenId: horseId1
    }))

    horses.push(await seaport.api.getAsset({
        tokenAddress: configContract.CONTRACT_ADDRESS,
        tokenId: horseId2
    }))

    // console.log("asset:")
    // console.log(asset)

    // console.log("horses: " + horses)

    // await Axios.get(`https://api.opensea.io/api/v1/asset/0x91a96a8ed695b7c59c01f845f7bb522fe906d88d/${horseId1}`, {
    //     params: {
    //     },
    //   }).then((response) => { 
    //       console.log(response)
    //   })

    // horses.push(await fetch(`https://api.opensea.io/api/v1/asset/0x91a96a8ed695b7c59c01f845f7bb522fe906d88d/${horseId1}`)
    // .then((res) => { return res })
    // .catch((e) => {
    //   console.error(e)
    //   console.error('Could not talk to OpenSea')
    //   return null
    // }))

    // horses.push(await fetch(`https://api.opensea.io/api/v1/asset/0x91a96a8ed695b7c59c01f845f7bb522fe906d88d/${horseId2}`)
    // .then((res) => { return res })
    // .catch((e) => {
    //   console.error(e)
    //   console.error('Could not talk to OpenSea')
    //   return null
    // }))

    if (horses == null || horses[0] == null || horses[1] == null) return null

    let horsesSimplified = []
    for(let i = 0; i < horses.length; i ++) {
        horsesSimplified.push({
            // Health: typeToHealth(horses[i].traits.filter(e => e.trait_type == "Breed")[0].value),
            // Attack: horses[i].traits.filter(e => e.trait_type == "Attack")[0].value,
            // Luck: horses[i].traits.filter(e => e.trait_type == "Luck")[0].value,
            // Defense: horses[i].traits.filter(e => e.trait_type == "Defense")[0].value
        })
    }

    // console.log("horsesSimplified: " + horsesSimplified)
    console.log("horsesSimplified[0]: " + JSON.stringify(horsesSimplified[0]))
    console.log("horsesSimplified[1]: " + JSON.stringify(horsesSimplified[1]))

    return horsesSimplified
}

function typeToHealth(breed) {
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