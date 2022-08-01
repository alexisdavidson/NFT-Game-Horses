import {
    Link,
    useNavigate
} from "react-router-dom"
import { Navbar, Nav, Button, Container } from 'react-bootstrap'
import { useUnityContext } from "react-unity-webgl";
import logo from '../images/Gallop_logo.png'

const Navigation = ({ web3Handler, account }) => {
    
    const { unload } = useUnityContext({
        loaderUrl: "build/Build.loader.js",
        dataUrl: "build/Build.data",
        frameworkUrl: "build/Build.framework.js",
        codeUrl: "build/Build.wasm",
      });

    
    let navigate = useNavigate(); 
    async function handleClickHome() {
        await unload();
        navigate("/");
    }

    return (
        <Navbar expand="lg" bg="light">
            <Container>
                <Navbar.Brand as={Link} to="/">
                {/* <Navbar.Brand as={Link} onClick={handleClickHome}> */}
                    <img src={logo} width="40" height="40" className="" alt="" />
                    &nbsp; Gallop
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