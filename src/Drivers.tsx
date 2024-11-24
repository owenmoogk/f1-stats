import { useState, useEffect } from 'react';
import { Driver } from "./types";
import { getDriverList } from './api';
import { calculateWinningAbility, PointsData } from './util';
import { interpolateColor } from './display';

export default function Drivers(props: {
	pointsData: PointsData,
}) {

	const [driverList, setDriverList] = useState<Driver[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			var pointsData = props.pointsData
			var racesLeft = pointsData.racesLeft
			var sprintsLeft = pointsData.sprintsLeft
			var pointsRemaining = pointsData.driverPoints
			var pointsRemainingForSecond = pointsData.driverPointsForSecond

			var tmpDriverList = await getDriverList();
			tmpDriverList = calculateWinningAbility(tmpDriverList, pointsRemaining, pointsRemainingForSecond, racesLeft, sprintsLeft)
			setDriverList(tmpDriverList)
		}
		fetchData()
	}, [props])


	return (
		<table>
			<tbody>
				<tr>
					<th>Position</th>
					<th>Name</th>
					<th>Points</th>
					<th>Can Win</th>
					<th className="hoverTooltip" title="If a driver scores the most points possible, does it guarantee them the championship?">Winnable on Performance</th>
					<th>Highest Possible Position</th>
					<th>Lowest Possible Position</th>
				</tr>
				{driverList.map((driver, index) => {
					const highestPossibleColor = interpolateColor(driver.highestPossible, driverList.length);
					const lowestPossibleColor = interpolateColor(driver.lowestPossible, driverList.length);
					const lockedIn = driver.highestPossible === driver.lowestPossible
					return (
						<tr key={index}>
							<td style={{backgroundColor: lockedIn ? "lightgrey": "", cursor: lockedIn ? "help" : ""}} title={lockedIn ? 'Locked In: This drivers finishing position is already determined.' : ""} >{index + 1}</td>
							<td>{driver.name}</td>
							<td>{driver.points}</td>
							<td className={driver.highestPossible === 1 ? "green" : "red"}>{driver.highestPossible === 1 ? "Yes" : "No"}</td>
							<td className={driver.canWinByThemselves ? "green" : "red"}>{driver.canWinByThemselves ? "Yes" : "No"}</td>
							<td style={{ backgroundColor: highestPossibleColor }}>
								P{driver.highestPossible}
							</td>
							<td style={{ backgroundColor: lowestPossibleColor }}>
								P{driver.lowestPossible}
							</td>
						</tr>
					)
				})}
			</tbody>
		</table>
	)
}