import './App.css';
import Drivers from './Drivers';
import Constructors from './Constructors';
import $ from 'jquery';
import { useState, useEffect } from 'react';

function App() {

  const [mostRecentRound, setMostRecentRound] = useState(-1);
  const [schedule, setSchedule] = useState();

  function getMostRecentRound(){
    fetch("https://ergast.com/api/f1/current/last/results")
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      setMostRecentRound(parseInt($(data).find("Race").attr("round")))
    })
  }

  function getSchedule(){
    fetch("https://ergast.com/api/f1/current")
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => setSchedule(data))
  }

  useEffect(() => {
    getMostRecentRound()
    getSchedule()
  }, [])

  return (
    <div className="App">
        <Drivers mostRecentRound={mostRecentRound} schedule={schedule} />
        <Constructors mostRecentRound={mostRecentRound} schedule={schedule} />
    </div>
  );
}

export default App;
