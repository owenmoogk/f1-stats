import './App.css';
import Drivers from './Drivers';
import Constructors from './Constructors';
import { useState, useEffect } from 'react';
import { getMostRecentRound, getSchedule } from './api';
import { getPointsRemaining, PointsData } from './util';

function App() {

	const [mostRecentRound, setMostRecentRound] = useState<number>(-1);
	const [schedule, setSchedule] = useState<Document>();
	const [pointsData, setPointsData] = useState<PointsData>();

	async function getData() {
		setMostRecentRound(await getMostRecentRound());
		setSchedule(await getSchedule());
	}

	useEffect(() => {
		getData()
	}, [])

	useEffect(() => {
		if (schedule && mostRecentRound !== -1) {
			var p = getPointsRemaining(schedule, mostRecentRound)
			setPointsData(p)
		}
	}, [mostRecentRound, schedule])

	return (
		<div className="App">
			<p>Note: This webpage will no longer be functional, due to the deprecation of the Ergast F1 API. Until a (free) alternative is found, it will remain unfunctional.</p>
			{pointsData ?
				<>
					<Drivers pointsData={pointsData} />
					<Constructors pointsData={pointsData} />
				</>
				: null
			}
		</div>
	);
}

export default App;
