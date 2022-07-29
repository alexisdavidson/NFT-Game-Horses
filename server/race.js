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

export const race = async function(nftList) {
    console.log("race " + nftList)

    let horses = await fetchHorses(nftList)
    if (horses == null)
        return null

    // Compute the winner and order of horses reaching the finishing line
    // nftList.sort(() => Math.random() - 0.5);
    // console.log("Shuffled array: " + nftList)
    for(let i = 0; i < horses.length; i ++) {
        horses[i].points = horses[i].Strength + horses[i].Stamina + horses[i].Speed + Math.floor(Math.random() * 100);
    }

    horses.sort((a,b) => b.points - a.points);
    console.log("Sorted array: " + JSON.stringify(horses));

    let raceLog = []
    raceLog.winner = nftList[0]
    raceLog.finishers = horses.map(a => parseInt(a.TokenId));
    console.log("finishers: " + raceLog.finishers);

    return raceLog
}

const defaultTraitValueIfNull = 50;

async function fetchHorses(nftList) {
    let horses = []

    for(let i = 0; i < nftList.length; i ++) {
        let horse = await seaport.api.getAsset({
            tokenAddress: configContract.CONTRACT_ADDRESS,
            tokenId: nftList[i]
        })

        if (horse != null)
            horses.push(horse)
    }

    if (horses == null || horses.length < 2)
        return null

    let horsesSimplified = []
    for(let i = 0; i < horses.length; i ++) {
        horsesSimplified.push({
            TokenId: horses[i].tokenId,
            Strength: horses[i].traits.filter(e => e.trait_type == "Strength")[0]?.value ?? defaultTraitValueIfNull,
            Stamina: horses[i].traits.filter(e => e.trait_type == "Stamina")[0]?.value ?? defaultTraitValueIfNull,
            Speed: horses[i].traits.filter(e => e.trait_type == "Natural Speed")[0]?.value ?? defaultTraitValueIfNull
        })
        console.log("horsesSimplified[" + i + "]: " + JSON.stringify(horsesSimplified[i]))
    }

    return horsesSimplified

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