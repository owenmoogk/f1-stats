import { useState, useEffect } from 'react';
import { Driver } from "./types";
import { getDriverList } from './api';
import { calculateWinningAbility, PointsData } from './util';

export default function Drivers(props: {
	pointsData: PointsData,
}) {

	const [driverList, setDriverList] = useState<Driver[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			setDriverList(await getDriverList())
		}
		fetchData()
	}, [])

	useEffect(() => {
		var pointsData = props.pointsData
		var racesLeft = pointsData.racesLeft
		var sprintsLeft = pointsData.sprintsLeft
		var pointsRemaining = pointsData.constructorPoints
		var pointsRemainingForSecond = pointsData.constructorPointsForSecond
		if (driverList.length >= 20) {
			setDriverList(calculateWinningAbility(driverList, pointsRemaining, pointsRemainingForSecond, racesLeft, sprintsLeft))
		}
	}, [props, setDriverList, driverList])


	return (
		<table>
			<tbody>
				<tr>
					<th>Position</th>
					<th>Name</th>
					<th>Points</th>
					<th>Can Win</th>
					<th>Winnable on Performance</th>
					<th>Highest Possible Position</th>
					<th>Lowest Possible Position</th>
				</tr>
				{driverList.map((driver, index) =>
					<tr key={index}>
						<td>{index + 1}</td>
						<td>{driver.name}</td>
						<td>{driver.points}</td>
						<td className={driver.highestPossible === 1 ? "green" : "red"}>{driver.highestPossible === 1 ? "Yes" : "No"}</td>
						<td className={driver.canWinByThemselves ? "green" : "red"}>{driver.canWinByThemselves ? "Yes" : "No"}</td>
						<td>P{driver.highestPossible}</td>
						<td>P{driver.lowestPossible}</td>
					</tr>
				)}
			</tbody>
		</table>
	)
}