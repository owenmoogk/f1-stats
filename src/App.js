import './App.css';
import Drivers from './Drivers';
import Constructors from './Constructors';

function App() {
  return (
    <div className="App">
      {/* <div style={{display: "flex", justifyContent: "space-around"}}> */}
        <Drivers />
        <Constructors />
      {/* </div> */}
    </div>
  );
}

export default App;
