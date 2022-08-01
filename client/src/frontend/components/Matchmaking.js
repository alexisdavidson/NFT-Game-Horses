import { useState, useEffect } from 'react'
import { Row, Col, Card } from 'react-bootstrap'
import {useLocation} from 'react-router-dom';
import logo from '../images/Gallop_logo.png'
import configContract from "./configContract.json";


const Matchmaking = () => {
    const location = useLocation();
    const [item, setItem] = useState([])

    const loadOpenSeaItem = async (horse) => {
        let item = await fetch(`${configContract.OPENSEA_API}/asset/${configContract.CONTRACT_ADDRESS}/${horse}`)
        .then((res) => res.json())
        .then((res) => { return res })
        .catch((e) => {
          console.error(e)
          console.error('Could not talk to OpenSea')
          return null
        })

        setItem(item)
    }

    useEffect(() => {
        loadOpenSeaItem(location.state.horse)
    }, [])

    return (
        <div className="flex justify-center">
            <h2>Waiting for Opponent...</h2>
            <div className="flex justify-center">
                <div className="px-5">
                    <Row xs={1} md={2} lg={4} className="g-4 py-5 d-flex justify-content-center">
                        <Col className="overflow-hidden">
                            <Card>
                                <Card.Img variant="top" src={item.image_url} />
                                <Card.Body color="secondary">
                                <Card.Title>{item.name}</Card.Title>
                                <Card.Text>
                                    <img src={logo} width="40" height="40" className="" alt="" />
                                </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
}
export default Matchmaking