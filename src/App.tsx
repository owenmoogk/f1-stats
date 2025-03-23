import { useState, useEffect } from 'react';

import { useGetMostRecentRoundNumber, useGetSchedule } from './api';
import './App.css';
import Constructors from './Constructors';
import Drivers from './Drivers';
import type { PointsData } from './util';
import { getPointsRemaining } from './util';

function App() {
  const [pointsData, setPointsData] = useState<PointsData>();

  const mostRecentRoundNumber = useGetMostRecentRoundNumber();
  const schedule = useGetSchedule();

  useEffect(() => {
    if (schedule && mostRecentRoundNumber && mostRecentRoundNumber !== -1) {
      const p = getPointsRemaining(schedule, mostRecentRoundNumber);
      setPointsData(p);
    }
  }, [mostRecentRoundNumber, schedule]);

  return (
    <div className="App">
      <h1>F1 Hypothetical Stats</h1>
      {mostRecentRoundNumber && schedule && (
        <h5>
          Last updated after the {schedule[mostRecentRoundNumber - 1]?.raceName}
        </h5>
      )}
      <h3>
        <a href="https://owenmoogk.github.io/projects/f1-stats">About / Info</a>
      </h3>
      {pointsData ? (
        <div
          style={{
            width: 'fit-content',
            margin: 'auto',
          }}
        >
          <Drivers pointsData={pointsData} />
          <Constructors pointsData={pointsData} />
        </div>
      ) : null}
    </div>
  );
}

export default App;
