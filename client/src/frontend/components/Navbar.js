import {
    Link
} from "react-router-dom"
import { Navbar, Nav, Button, Container } from 'react-bootstrap'
import dice from '../images/Dice.PNG'

const Navigation = ({ web3Handler, account }) => {
    return (
        <Navbar expand="lg" bg="light">
            <Container>
                <Navbar.Brand as={Link} to="/">
                    {/* <img src={dice} width="40" height="40" className="" alt="" /> */}
                    &nbsp; Unstable Horses Yard Racing Game
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                         {/* <Nav.Link as={Link} to="/matchmaking-pool">Matchmaking Pool</Nav.Link> */}
                         {/* <Nav.Link as={Link} to="/match-history">Match History</Nav.Link> */}
                    </Nav>
                    <Nav>
                        {account ? (
                            <Nav.Link
                                href={`https://etherscan.io/address/${account}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button nav-button btn-sm mx-4">
                                <Button variant="outline-dark">
                                    {account.slice(0, 5) + '...' + account.slice(38, 42)}
                                </Button>

                            </Nav.Link>
                        ) : (
                            <Button onClick={web3Handler} variant="outline-dark">Connect Wallet</Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )

}

export default Navigation;