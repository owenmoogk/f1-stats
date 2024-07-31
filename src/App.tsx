import './App.css';
import Drivers from './Drivers';
import Constructors from './Constructors';
import $ from 'jquery'
import { useState, useEffect } from 'react';

function App() {

  const [mostRecentRound, setMostRecentRound] = useState<number>(-1);
  const [schedule, setSchedule] = useState<any>();

  function getMostRecentRound(){
    fetch("https://ergast.com/api/f1/current/last/results")
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      setMostRecentRound(parseInt($(data).find("Race").attr("round") ?? ""))
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
		<p>Note: This webpage will no longer be functional, due to the deprecation of the Ergast F1 API. Until a (free) alternative is found, it will remain unfunctional.</p>
        <Drivers mostRecentRound={mostRecentRound} schedule={schedule} />
        <Constructors mostRecentRound={mostRecentRound} schedule={schedule} />
    </div>
  );
}

export default App;
