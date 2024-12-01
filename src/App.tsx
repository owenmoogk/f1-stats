import './App.css';
import Drivers from './Drivers';
import Constructors from './Constructors';
import { useState, useEffect } from 'react';
import { useGetMostRecentRound, useGetSchedule } from './api';
import { getPointsRemaining, PointsData } from './util';

function App() {

	const [pointsData, setPointsData] = useState<PointsData>();

	const mostRecentRound = useGetMostRecentRound();
	const schedule = useGetSchedule();

	console.log(mostRecentRound)

	useEffect(() => {
		if (schedule && mostRecentRound && mostRecentRound.round !== -1) {
			var p = getPointsRemaining(schedule, mostRecentRound.round)
			setPointsData(p)
		}
	}, [mostRecentRound, schedule])

	return (
		<div className="App">
			<h1>F1 Hypothetical Stats</h1>
			<h5>Last updated after the {mostRecentRound?.raceName}</h5>
			<h3><a href="https://owenmoogk.github.io/projects/f1-stats">About / Info</a></h3>
			{pointsData ?
				<div style={{
					width: "fit-content",
					margin: "auto",
				}}>
					<Drivers pointsData={pointsData} />
					<Constructors pointsData={pointsData} />
				</div>
				: null
			}
		</div>
	);
}

export default App;
