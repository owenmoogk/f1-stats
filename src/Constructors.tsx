import { useState, useEffect } from 'react';
import { Constructor } from "./types";
import { getConstructorList } from './api';
import { calculateWinningAbility, PointsData } from './util';

export default function Constructors(props: {
	pointsData: PointsData,
}) {
	const [constructorList, setConstructorList] = useState<Constructor[]>([]);


	useEffect(() => {
		const getData = async () => {
			setConstructorList(await getConstructorList())
		}
		getData()
	}, [])



	useEffect(() => {
		var pointsData = props.pointsData
		var racesLeft = pointsData.racesLeft
		var sprintsLeft = pointsData.sprintsLeft
		var pointsRemaining = pointsData.constructorPoints
		var pointsRemainingForSecond = pointsData.constructorPointsForSecond
		if (constructorList.length > 0) {
			setConstructorList(calculateWinningAbility(constructorList, pointsRemaining, pointsRemainingForSecond, racesLeft, sprintsLeft))
		}
	}, [constructorList, setConstructorList, props.pointsData])


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
				{constructorList.map((constructor, index) =>
					<tr key={index}>
						<td>{index + 1}</td>
						<td>{constructor.name}</td>
						<td>{constructor.points}</td>
						<td className={constructor.highestPossible === 1 ? "green" : "red"}>{constructor.highestPossible === 1 ? "Yes" : "No"}</td>
						<td className={constructor.canWinByThemselves ? "green" : "red"}>{constructor.canWinByThemselves ? "Yes" : "No"}</td>
						<td>P{constructor.highestPossible}</td>
						<td>P{constructor.lowestPossible}</td>
					</tr>
				)}
			</tbody>
		</table>
	)
}