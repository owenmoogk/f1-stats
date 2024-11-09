import { useState, useEffect } from 'react';
import { Constructor } from "./types";
import { getConstructorList } from './api';
import { calculateWinningAbility, PointsData } from './util';
import { interpolateColor } from './display';

export default function Constructors(props: {
	pointsData: PointsData,
}) {

	const [constructorList, setConstructorList] = useState<Constructor[]>([]);

	useEffect(() => {
		const getData = async () => {
			var pointsData = props.pointsData
			var racesLeft = pointsData.racesLeft
			var sprintsLeft = pointsData.sprintsLeft
			var pointsRemaining = pointsData.constructorPoints
			var pointsRemainingForSecond = pointsData.constructorPointsForSecond

			var tmpConstructorList = await getConstructorList();
			tmpConstructorList = calculateWinningAbility(tmpConstructorList, pointsRemaining, pointsRemainingForSecond, racesLeft, sprintsLeft)
			setConstructorList(tmpConstructorList);
		}
		getData()
	}, [props])


	return (
		<table>
			<tbody>
				<tr>
					<th>Position</th>
					<th>Name</th>
					<th>Points</th>
					<th>Can Win</th>
					<th className="hoverTooltip" title="If a constructor scores the most points possible, does it guarantee them the championship?">Winnable on Performance</th>
					<th>Highest Possible Position</th>
					<th>Lowest Possible Position</th>
				</tr>
				{constructorList.map((constructor, index) => {
					const highestPossibleColor = interpolateColor(constructor.highestPossible, constructorList.length);
					const lowestPossibleColor = interpolateColor(constructor.lowestPossible, constructorList.length);
					const lockedIn = constructor.highestPossible === constructor.lowestPossible
					return (
						<tr key={index}>
							<td style={{backgroundColor: lockedIn ? "lightgrey": "", cursor: lockedIn ? "help" : ""}} title={lockedIn ? 'Locked In: This constructors finishing position is already determined.' : ""} >{index + 1}</td>
							<td>{constructor.name}</td>
							<td>{constructor.points}</td>
							<td className={constructor.highestPossible === 1 ? "green" : "red"}>{constructor.highestPossible === 1 ? "Yes" : "No"}</td>
							<td className={constructor.canWinByThemselves ? "green" : "red"}>{constructor.canWinByThemselves ? "Yes" : "No"}</td>
							<td style={{ backgroundColor: highestPossibleColor }}>
								P{constructor.highestPossible}
							</td>
							<td style={{ backgroundColor: lowestPossibleColor }}>
								P{constructor.lowestPossible}
							</td>
						</tr>
					)
				})}
			</tbody>
		</table>
	)
}